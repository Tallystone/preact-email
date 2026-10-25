// Vendored from resend/react-email; edit the sync script, not this file.
type WithEmailStyle<Props> = Props extends unknown ? Omit<Props, 'style'> & { style?: React.CSSProperties } : never;
import * as React from 'preact/compat';
import { markAsElement } from '../element-marker.js';

export type ImgProps = Readonly<WithEmailStyle<React.ImgHTMLAttributes<HTMLImageElement>>>;

export const Img: React.FunctionComponent<ImgProps & React.RefAttributes<HTMLImageElement>> = React.forwardRef<HTMLImageElement, ImgProps>(
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
