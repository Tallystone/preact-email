// Vendored from resend/react-email; edit the sync script, not this file.
import * as React from 'preact/compat';
import { markAsElement } from '../element-marker.js';

export type ColumnProps = Readonly<Omit<React.ComponentPropsWithoutRef<'td'>, 'style'> & { style?: React.CSSProperties }>;

export const Column = React.forwardRef<HTMLTableCellElement, ColumnProps>(
  ({ children, style, ...props }, ref) => {
    return (
      <td {...props} data-id="__react-email-column" ref={ref} style={style}>
        {children}
      </td>
    );
  },
);

Column.displayName = 'Column';
markAsElement(Column);
