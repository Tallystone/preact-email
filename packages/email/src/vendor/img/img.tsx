// Vendored from resend/react-email; edit the sync script, not this file.
import * as React from 'preact/compat';
import { markAsElement } from '../element-marker.js';

export type ImgProps = Readonly<Omit<React.ComponentPropsWithoutRef<'img'>, 'style'> & { style?: React.CSSProperties }>;

export const Img = React.forwardRef<HTMLImageElement, ImgProps>(
  ({ alt, src, width, height, style, ...props }, ref) => (
    <img
      {...props}
      alt={alt ?? ''}
      height={height}
      ref={ref}
      src={src}
      style={{
        display: 'block',
        outline: 'none',
        border: 'none',
        textDecoration: 'none',
        ...style,
      }}
      width={width}
    />
  ),
);

Img.displayName = 'Img';
markAsElement(Img);
