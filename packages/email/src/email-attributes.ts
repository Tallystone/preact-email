import "preact";
declare module "preact" {
  namespace JSX {
    interface TableHTMLAttributes<T extends EventTarget = HTMLTableElement> {
      align?: string;
      border?: string | number;
    }
  }
}
