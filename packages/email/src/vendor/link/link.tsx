// Vendored from resend/react-email; edit the sync script, not this file.
import * as React from 'preact/compat';
import { markAsElement } from '../element-marker.js';

export type LinkProps = Readonly<Omit<React.ComponentPropsWithoutRef<'a'>, 'style'> & { style?: React.CSSProperties }>;

export const Link = React.forwardRef<HTMLAnchorElement, LinkProps>(
  ({ target = '_blank', style, ...props }, ref) => (
    <a
      {...(props as React.ComponentProps<'a'>)}
      ref={ref}
      style={{
        color: '#067df7',
        textDecorationLine: 'none',
        ...style,
      }}
      target={target}
    >
      {props.children}
    </a>
  ),
);

Link.displayName = 'Link';
markAsElement(Link);
