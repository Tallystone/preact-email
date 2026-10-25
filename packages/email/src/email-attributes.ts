import "preact";
declare module "preact" {
  interface TableHTMLAttributes<T extends EventTarget = HTMLTableElement> {
    align?: string;
    border?: string | number;
  }
}
