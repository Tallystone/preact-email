// Vendored from resend/react-email; edit the sync script, not this file.
import type * as React from 'preact/compat';
export type As<
  DefaultTag extends React.ElementType,
  T1 extends React.ElementType,
  T2 extends React.ElementType = T1,
  T3 extends React.ElementType = T1,
  T4 extends React.ElementType = T1,
  T5 extends React.ElementType = T1,
> =
  | (Omit<React.ComponentPropsWithRef<DefaultTag>, 'style'> & { style?: React.CSSProperties } & {
      as?: DefaultTag;
    })
  | (Omit<React.ComponentPropsWithRef<T1>, 'style'> & { style?: React.CSSProperties } & {
      as: T1;
    })
  | (Omit<React.ComponentPropsWithRef<T2>, 'style'> & { style?: React.CSSProperties } & {
      as: T2;
    })
  | (Omit<React.ComponentPropsWithRef<T3>, 'style'> & { style?: React.CSSProperties } & {
      as: T3;
    })
  | (Omit<React.ComponentPropsWithRef<T4>, 'style'> & { style?: React.CSSProperties } & {
      as: T4;
    })
  | (Omit<React.ComponentPropsWithRef<T5>, 'style'> & { style?: React.CSSProperties } & {
      as: T5;
    });
