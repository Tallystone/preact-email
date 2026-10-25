import { h, type ComponentChildren } from 'preact';
import { renderAsync, toPlainText } from '@tallystone/preact-email';

/** Structural Zod interface: no validator is imported or installed at runtime. */
export interface EmailSchema<Input = unknown, Output = unknown> {
  readonly _input: Input;
  readonly _output: Output;
  parseAsync(input: unknown): Promise<Output>;
}
type EmailComponent = ((props: any) => ComponentChildren) & {
  Schema?: EmailSchema;
  Subject?: (props: any) => string | Promise<string>;
};
type Props<C extends EmailComponent> = Parameters<C>[0] extends undefined
  ? Record<string, never> : Parameters<C>[0];
export type EmailInput<C extends EmailComponent> = C extends { Schema: EmailSchema<infer Input, unknown> }
  ? Input : Props<C>;

/** Validates before rendering; schema defaults/transforms also apply to Subject. */
export function createEmailRenderer<C extends EmailComponent>(Component: C) {
  return {
    schema: Component.Schema as C extends { Schema: infer Schema } ? Schema : undefined,
    async render(...args: {} extends EmailInput<C> ? [props?: EmailInput<C>] : [props: EmailInput<C>]) {
      const props = Component.Schema
        ? await Component.Schema.parseAsync(args[0] ?? {})
        : args[0] ?? {};
      const subject = await Component.Subject?.(props);
      if (subject !== undefined && typeof subject !== 'string') throw new TypeError('Subject must return a string');
      const html = await renderAsync(h(Component, props as Props<C>));
      return { html, text: toPlainText(html), ...(subject === undefined ? {} : { subject }) };
    },
  };
}
