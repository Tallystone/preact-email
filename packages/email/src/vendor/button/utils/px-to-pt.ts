// Vendored from resend/react-email; edit the sync script, not this file.
export const pxToPt = (px: number | undefined): number | undefined =>
  typeof px === 'number' && !Number.isNaN(Number(px))
    ? (px * 3) / 4
    : undefined;
