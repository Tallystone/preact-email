// Vendored from resend/react-email; edit the sync script, not this file.
export const fromDashCaseToCamelCase = (text: string) => {
  return text.replace(/-(\w|$)/g, (_, p1: string) => p1.toUpperCase());
};
