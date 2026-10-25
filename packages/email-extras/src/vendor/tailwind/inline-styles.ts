// Vendored from resend/react-email; edit the sync script, not this file.
import type { StyleSheet } from 'css-tree';
import { extractRulesPerClass } from './utils/css/extract-rules-per-class.js';
import { getCustomProperties } from './utils/css/get-custom-properties.js';
import { makeInlineStylesFor } from './utils/css/make-inline-styles-for.js';

export function inlineStyles(
  styleSheet: StyleSheet,
  classes: string[],
): Record<string, string> {
  const { inlinable: inlinableRules } = extractRulesPerClass(
    styleSheet,
    classes,
  );

  const customProperties = getCustomProperties(styleSheet);

  return makeInlineStylesFor(
    Array.from(inlinableRules.values()).flat(),
    customProperties,
  );
}
