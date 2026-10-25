// Vendored from resend/react-email; edit the sync script, not this file.
/**
 * Downlevels modern CSS features that email clients don't support,
 * operating on a css-tree StyleSheet AST.
 *
 * 1. CSS Nesting: unnests @media rules from inside selectors
 *    `.sm_p-4{@media (min-width:40rem){padding:1rem!important}}`
 *    → `@media (min-width:40rem){.sm_p-4{padding:1rem!important}}`
 *
 * 2. Media Queries Level 4 range syntax → legacy min-width/max-width
 *    `(width>=40rem)` → `(min-width:40rem)`
 *
 * Gmail, Outlook, Yahoo, and most email clients don't support either feature.
 * See: https://www.caniemail.com/features/css-at-media/
 *      https://www.caniemail.com/features/css-nesting/
 */

import {
  type Atrule,
  type CssNode,
  clone,
  type Feature,
  type FeatureRange,
  List,
  type ListItem,
  type Rule,
  type StyleSheet,
  walk,
} from 'css-tree';
import { NON_INLINABLE_ATRULES } from './constants.js';


/**
 * Unnest @media at-rules from inside regular rules, and downlevel
 * range media query syntax to legacy min-width/max-width.
 *
 * Mutates the stylesheet in place.
 */
export function downlevelForEmailClients(styleSheet: StyleSheet): void {
  unnestMediaQueries(styleSheet);
  downlevelRangeMediaQueries(styleSheet);
}

// ---------------------------------------------------------------------------
// Unnesting
// ---------------------------------------------------------------------------

interface UnnestTransform {
  parentRule: Rule;
  parentItem: ListItem<CssNode>;
  parentList: List<CssNode>;
  nestedAtrules: Atrule[];
  remainingChildren: CssNode[];
}

/**
 * Walk the stylesheet and unnest any @media/@supports rules that are nested
 * inside regular rules. For each, the parent Rule's selector wraps the
 * at-rule's body.
 *
 * Before: `.sm_p-4 { @media (...) { padding: 1rem } }`
 * After:  `@media (...) { .sm_p-4 { padding: 1rem } }`
 */
function unnestMediaQueries(styleSheet: StyleSheet): void {
  const transforms: UnnestTransform[] = [];

  walk(styleSheet, {
    visit: 'Rule',
    enter(rule, item, list) {
      if (!rule.block || !item) return;

      const nestedAtrules: Atrule[] = [];
      const remainingChildren: CssNode[] = [];

      rule.block.children.forEach((child) => {
        if (
          child.type === 'Atrule' &&
          NON_INLINABLE_ATRULES.has(child.name.toLowerCase())
        ) {
          nestedAtrules.push(child);
        } else {
          remainingChildren.push(child);
        }
      });

      if (nestedAtrules.length > 0) {
        transforms.push({
          parentRule: rule,
          parentItem: item,
          parentList: list,
          nestedAtrules,
          remainingChildren,
        });
      }
    },
  });

  // Apply in reverse so list positions stay valid
  for (let i = transforms.length - 1; i >= 0; i--) {
    const {
      parentRule,
      parentItem,
      parentList,
      nestedAtrules,
      remainingChildren,
    } = transforms[i]!;

    // Build replacement list: [modified parent rule (if any), unnested @media rules...]
    const replacements = new List<CssNode>();

    if (remainingChildren.length > 0) {
      parentRule.block.children = new List<CssNode>().fromArray(
        remainingChildren,
      );
      replacements.appendData(parentRule);
    }

    for (const atrule of nestedAtrules) {
      const wrappedRule: Rule = {
        type: 'Rule',
        prelude: clone(parentRule.prelude) as Rule['prelude'],
        block: {
          type: 'Block',
          children: atrule.block ? atrule.block.children : new List<CssNode>(),
        },
      };

      const newAtrule: Atrule = {
        type: 'Atrule',
        name: atrule.name,
        prelude: atrule.prelude,
        block: {
          type: 'Block',
          children: new List<CssNode>().fromArray([wrappedRule]),
        },
      };

      replacements.appendData(newAtrule);
    }

    // Replace the original rule with the entire list of new nodes
    parentList.replace(parentItem, replacements);
  }
}

// ---------------------------------------------------------------------------
// Range media query downleveling
// ---------------------------------------------------------------------------

/**
 * Walk all nodes and downlevel range syntax (`FeatureRange`) inside @media
 * preludes to legacy `Feature` nodes (`min-width` / `max-width`).
 */
function downlevelRangeMediaQueries(styleSheet: StyleSheet): void {
  const replacements: Array<{
    item: ListItem<CssNode>;
    replacement: Feature;
  }> = [];

  walk(styleSheet, {
    enter(originalNode: CssNode, item: ListItem<CssNode> | null) {
      // See module augmentation above: `CssNode` (from @types/css-tree 2.x)
      // doesn't include `FeatureRange`, so widen here to enable narrowing.
      const node = originalNode as CssNode | FeatureRange;
      if (item && node.type === 'FeatureRange') {
        const replacement = downlevelFeatureRange(node);
        if (replacement) {
          replacements.push({ item, replacement });
        }
      }
    },
  });

  for (const { item, replacement } of replacements) {
    // See module augmentation above: `Feature` is not part of the `CssNode`
    // union, so a single cast is required when handing it back to the AST.
    item.data = replacement as unknown as CssNode;
  }
}

/**
 * Convert a `FeatureRange` node to a `Feature` node (legacy min-/max- syntax).
 *
 * For `width >= 40rem`: left=Identifier("width"), leftComparison=">=", middle=Dimension("40","rem")
 * Result: { type: "Feature", name: "min-width", value: Dimension("40","rem") }
 */
function downlevelFeatureRange(range: FeatureRange): Feature | null {
  if (range.left.type !== 'Identifier') return null;

  let prefix: string;
  if (range.leftComparison === '>=' || range.leftComparison === '>') {
    prefix = 'min-';
  } else if (range.leftComparison === '<=' || range.leftComparison === '<') {
    prefix = 'max-';
  } else {
    return null;
  }

  return {
    type: 'Feature',
    kind: 'media',
    name: `${prefix}${range.left.name}`,
    value: range.middle,
  };
}
