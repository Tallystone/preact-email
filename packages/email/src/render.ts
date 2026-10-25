import { renderToString, renderToStringAsync } from "preact-render-to-string";
import { createElement, Fragment, type ComponentChildren } from "preact";
export const doctype =
  '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">';
/** Synchronous HTML rendering. Templates must use Preact's JSX runtime. */
export function render(node: ComponentChildren): string {
  return (
    doctype +
    renderToString(createElement(Fragment, null, node)).replace(
      /<!DOCTYPE[^>]*>/i,
      "",
    )
  );
}
/** Async/Suspense-capable path, including the optional Tailwind component. */
export async function renderAsync(node: ComponentChildren): Promise<string> {
  return (
    doctype +
    (await renderToStringAsync(createElement(Fragment, null, node))).replace(
      /<!DOCTYPE[^>]*>/i,
      "",
    )
  );
}
