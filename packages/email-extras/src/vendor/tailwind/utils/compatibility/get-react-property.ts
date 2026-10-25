// Vendored from resend/react-email; edit the sync script, not this file.
import { fromDashCaseToCamelCase } from '../text/from-dash-case-to-camel-case.js';

export function getReactProperty(prop: string) {
  const modifiedProp = prop.toLowerCase();

  if (modifiedProp.startsWith('--')) {
    return modifiedProp;
  }

  if (modifiedProp.startsWith('-ms-')) {
    return fromDashCaseToCamelCase(modifiedProp.slice(1));
  }

  return fromDashCaseToCamelCase(modifiedProp);
}
