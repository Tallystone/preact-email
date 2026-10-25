// Vendored from resend/react-email; edit the sync script, not this file.
import * as React from 'preact/compat';

export type HtmlProps = Readonly<Omit<React.ComponentPropsWithoutRef<'html'>, 'style'> & { style?: React.CSSProperties }>;

export const Html = React.forwardRef<HTMLHtmlElement, HtmlProps>(
  ({ children, lang = 'en', dir = 'ltr', ...props }, ref) => (
    <html {...props} dir={dir} lang={lang} ref={ref}>
      {children}
    </html>
  ),
);

Html.displayName = 'Html';
