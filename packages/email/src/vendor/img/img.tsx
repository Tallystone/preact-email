// Vendored from resend/react-email; edit the sync script, not this file.
import * as React from 'preact/compat';
import { markAsElement } from '../element-marker.js';

export type ImgProps = Readonly<Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'style'> & { style?: React.CSSProperties }>;

export const Img = React.forwardRef<HTMLImageElement, ImgProps>(
  ({ alt, src, width, height, style, ...props }, ref) => (
    <img {...{ ...props, alt: alt ?? '', height, ref, src, style: {
        display: 'block',
        outline: 'none',
        border: 'none',
        textDecoration: 'none',
        ...style,
      }, width } as React.ComponentProps<'img'>} />
  ),
);

Img.displayName = 'Img';
markAsElement(Img);
