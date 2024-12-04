import { NodeTypes } from "./ast";
import { TO_DISPLAY_STRING } from "./runtimeHelpers";

export function transform (root, options = {}) {
  const context = createTransformContext(root, options)
  // 1. 遍历 - 深度优先搜索
  traverseNode(root, context)
  // 2. 修改 text content

  createRootCodegen(root, context);

  root.helpers = [...context.helpers.keys()]
}

function createRootCodegen(root:any, context: any) {
  root.codegenNode = root.children[0]
}

function createTransformContext(root: any, options: any):any {
  const context = {
    root,
    nodeTransforms: options.nodeTransforms || [],
    helpers: new Map(),
    helper(key) {
      context.helpers.set(key,1)
    }
  };
  return context
}

function traverseNode(node: any, context) {
  console.log(node);
  // 遍历调用所有的 nodeTransforms
  // 把 node 给到 transform
  // 用户可以对 node 做处理
  const nodeTransforms = context.nodeTransforms
  for (let i = 0; i < nodeTransforms.length; i++) {
    const transform = nodeTransforms[i];
    transform(node);
  }

  switch (node.type) {
    case NodeTypes.INTERPOLATION:
      context.helper(TO_DISPLAY_STRING)
      break;

    case NodeTypes.ROOT:
    case NodeTypes.ELEMENT:
      traverseChildren(node, context);
      break;
  
    default:
      break;
  }  
}
function traverseChildren(node: any, context: any) {
  const children = node.children;
  if (children) {
    for (let i = 0; i < children.length; i++) {
      const node = children[i];
      traverseNode(node, context);
    }
  }
}

