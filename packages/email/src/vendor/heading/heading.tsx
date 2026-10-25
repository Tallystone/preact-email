// Vendored from resend/react-email; edit the sync script, not this file.
import * as React from 'preact/compat';
import { markAsElement } from '../element-marker.js';
import type { As } from './utils/as.js';
import type { Margin } from './utils/spaces.js';
import { withMargin } from './utils/spaces.js';

export type HeadingAs = As<'h1', 'h2', 'h3', 'h4', 'h5', 'h6'>;
export type HeadingProps = HeadingAs & Margin;

export const Heading = React.forwardRef<
  HTMLHeadingElement,
  Readonly<HeadingProps>
>(
  (
    { as: Tag = 'h1', children, style, m, mx, my, mt, mr, mb, ml, ...props },
    ref,
  ) => {
    return (
      <Tag
        {...props}
        ref={ref}
        style={{ ...withMargin({ m, mx, my, mt, mr, mb, ml }), ...style }}
      >
        {children}
      </Tag>
    );
  },
);

Heading.displayName = 'Heading';
markAsElement(Heading);
