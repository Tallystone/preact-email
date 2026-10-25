export type {} from "./email-attributes.js";
import { render } from "./render.js";
import type { ComponentChildren } from "preact";
import { textFromTree, toPlainText, type TextMethod } from "./text.js";
export * from "./vendor/index.js";
export { textFromTree, toPlainText, type TextMethod } from "./text.js";
export { render, renderAsync, doctype } from "./render.js";
export function renderEmail(
  node: ComponentChildren,
  options: { textMethod?: TextMethod } = {},
): { html: string; text: string } {
  const method = options.textMethod ?? "parser";
  const text = method === "tree" ? textFromTree(node) : undefined;
  const html = render(node);
  return {
    html,
    text: text ?? toPlainText(html, method === "regex" ? "regex" : "parser"),
  };
}
