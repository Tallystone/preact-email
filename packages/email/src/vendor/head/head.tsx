// Vendored from resend/react-email; edit the sync script, not this file.
import * as React from 'preact/compat';

export type HeadProps = Readonly<Omit<React.ComponentPropsWithoutRef<'head'>, 'style'> & { style?: React.CSSProperties }>;

export const Head = React.forwardRef<HTMLHeadElement, HeadProps>(
  ({ children, ...props }, ref) => (
    <head {...props} ref={ref}>
      <meta content="text/html; charset=UTF-8" httpEquiv="Content-Type" />
      <meta name="x-apple-disable-message-reformatting" />
      {children}
    </head>
  ),
);

Head.displayName = 'Head';
