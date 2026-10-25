// Vendored from resend/react-email; edit the sync script, not this file.
import * as React from 'preact/compat';
import { markAsElement } from '../element-marker.js';

export type HrProps = Readonly<Omit<React.ComponentPropsWithoutRef<'hr'>, 'style'> & { style?: React.CSSProperties }>;

export const Hr = React.forwardRef<HTMLHRElement, HrProps>(
  ({ style, ...props }, ref) => (
    <hr
      {...props}
      ref={ref}
      style={{
        width: '100%',
        border: 'none',
        borderColor: 'transparent',
        borderTop: '1px solid #eaeaea',
        ...style,
      }}
    />
  ),
);

Hr.displayName = 'Hr';
markAsElement(Hr);
