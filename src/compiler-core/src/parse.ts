import { NodeTypes } from "./ast";

const enum TagType {
  Start,
  End
}

export function baseParse(content: string) {
  const context = createParserContext(content)
  return createRoot(parseChildren(context, []))
}

function parseChildren(context, ancestors) {
  console.log("开始解析 children");
  const nodes: any = [];

  while (!isEnd(context, ancestors)) {
    let node;
    const s = context.source
    if(s.startsWith("{{")) {
      // 看看如果是 {{ 开头的话，那么就是一个插值， 那么去解析他
      node = parseInterpolation(context);
    }else if(s[0] === "<") {
      if(/[a-z]/i.test(s[1])) {
        node = parseElement(context, ancestors); 
      }
    }
    if(!node) {
      node = parseText(context)
    }
    nodes.push(node);
  }
  return nodes;
}

function isEnd(context: any, ancestors) {
  // 检测标签的节点
  // 如果是结束标签的话，需要看看之前有没有开始标签，如果有的话，那么也应该结束
  // 这里的一个 edge case 是 <div><span></div>
  // 像这种情况下，其实就应该报错
  const s = context.source;
  if(s.startsWith("</")) {
    // 从后面往前面查
    // 因为便签如果存在的话 应该是 ancestors 最后一个元素
    for (let i = ancestors.length - 1; i >= 0; --i) {
      if(startsWithEndTagOpen(s, ancestors[i].tag)) {
        return true;
      }
    }
  }
  // 看看 context.source 还有没有值
  return !s
}

function parseElement(context: any, ancestors) {
  // 解析tag
  const element:any = parseTag(context, TagType.Start);
  ancestors.push(element);
  element.children = parseChildren(context, ancestors);
  ancestors.pop();

  // 解析 end tag 是为了检测语法是不是正确的
  // 检测是不是和 start tag (即element.tag) 一致
  if(startsWithEndTagOpen(context.source, element.tag)) {
    parseTag(context, TagType.End);
  }else {
    throw new Error(`缺少结束标签:${element.tag}`);
    
  }
  return element;
}

function startsWithEndTagOpen(source: string, tag: string) {
  // 1. 头部 是不是以  </ 开头的
  // 2. 看看是不是和 tag 一样
  return  source.startsWith("</") && source.slice(2, 2 + tag.length).toLowerCase() === tag
}

function parseTag(context: any, type: TagType) {
  // 发现如果不是 > 的话，那么就把字符都收集起来 ->div
  // 正则
  const match: any = /^<\/?([a-z]*)/i.exec(context.source);
  const tag = match[1];
  // 移动光标
  // <div
  advanceBy(context, match[0].length);
  // 暂时不处理 selfClose 标签的情况 ，所以可以直接 advanceBy 1个坐标 <div 的下一个就是 >
  advanceBy(context, 1);
  
  if(type === TagType.End) return;

  return {
    type: NodeTypes.ELEMENT,
    tag
  };
}

function parseInterpolation(context) {
  // 1. 先获取到结束的index
  // 2. 通过 closeIndex - startIndex 获取到内容的长度 contextLength
  // 3. 通过 slice 截取内容

  // }} 是插值的关闭
  // 优化点是从 {{ 后面搜索即可
  const openDelimiter = "{{"
  const closeDelimiter = "}}"
  const closeIndex = context.source.indexOf(closeDelimiter,openDelimiter.length);

  // 让代码前进2个长度，可以把 {{ 干掉
  advanceBy(context, 2);

  const rawContentLength = closeIndex - openDelimiter.length;
  const rawContent = parseTextData(context, rawContentLength)

  const content = rawContent.trim();

  // 最后在让代码前进2个长度，可以把 }} 干掉
  advanceBy(context, closeDelimiter.length);

  return {
    type: NodeTypes.INTERPOLATION,
    content: {
      type: NodeTypes.SIMPLE_EXPRESSION,
      content: content,
    },
  }
}

function parseText(context: any): any {
  console.log("解析 text", context);
  // endIndex 应该看看有没有对应的 <
  // 比如 hello</div>
  // 像这种情况下 endIndex 就应该是在 o 这里
  let endIndex = context.source.length
  const endTokens = ["<","{{"]

  for (let i = 0; i < endTokens.length; i++) {
    const index = context.source.indexOf(endTokens[i])
    // index < endIndex 再赋值是需要 endIndex 尽可能的小
    // 比如说：
    // hi, {{123}} <div></div>
    // 那么这里就应该停到 {{ 这里，而不是停到 <div 这里
    if(index !== -1 && index < endIndex) {
      endIndex = index;
    }
  }

  const content = parseTextData(context, endIndex)

  return {
    type: NodeTypes.TEXT,
    content
  }
}

function parseTextData(context: any, length) {
  console.log("解析 textData");
  // 1. 直接返回 context.source
  // 从 length 切的话，是为了可以获取到 text 的值（需要用一个范围来确定）
  const rawText = context.source.slice(0, length)

  // 2. 移动光标
  advanceBy(context, length)
  return rawText
}

function createRoot(children) {
  return {
    children,
  }
}

function createParserContext(content: string): any {
  return {
    source: content,
  }
}

function advanceBy(context:any, numberOfCharacters:number) {
  console.log("推进代码", context, numberOfCharacters);
  context.source = context.source.slice(numberOfCharacters);
}

function startsWith(source: string, searchString: string): boolean {
  return source.startsWith(searchString);
}