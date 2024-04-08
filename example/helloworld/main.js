import { App } from "./App";
import { createApp } from "../../lib/guide-mini-vue.esm";
//vue3
const rootContainer = document.querySelector("#app");
createApp(App).mount(rootContainer);