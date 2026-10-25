// Vendored from resend/react-email; edit the sync script, not this file.
import * as React from 'preact/compat';
import { markAsElement } from '../element-marker.js';

export type RowProps = Readonly<
  Omit<React.ComponentPropsWithoutRef<'table'>, 'style'> & { style?: React.CSSProperties } & {
    children: React.ReactNode;
  }
>;

export const Row = React.forwardRef<HTMLTableElement, RowProps>(
  ({ children, style, ...props }, ref) => {
    return (
      <table
        align="center"
        width="100%"
        border={0}
        cellPadding="0"
        cellSpacing="0"
        role="presentation"
        {...props}
        ref={ref}
        style={style}
      >
        <tbody style={{ width: '100%' }}>
          <tr style={{ width: '100%' }}>{children}</tr>
        </tbody>
      </table>
    );
  },
);

Row.displayName = 'Row';
markAsElement(Row);
