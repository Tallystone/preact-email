/**
 * Local preview profiles, not client rendering engines.
 * Sources and limitations: tools/parity/test-emails/README.md.
 */
type Mode = 'authored' | 'unchanged' | 'partial' | 'full';
interface Profile {
  label: string;
  group: string;
  mode: Mode;
  lightOnly?: boolean;
  outlook?: boolean;
}
export const profiles: Record<string, Profile> = {
  'apple-macos': {
    group: 'Authored dark styles',
    label: 'Apple Mail / Outlook macOS',
    mode: 'authored',
  },
  'gmail-web': {
    group: 'Unchanged message colors',
    label: 'Gmail web · desktop / mobile',
    mode: 'unchanged',
  },
  'gmail-android': {
    group: 'Selective color adjustment',
    label: 'Gmail Android · Google account',
    mode: 'partial',
    lightOnly: true,
  },
  'gmail-android-other': {
    group: 'Selective color adjustment',
    label: 'Gmail Android · other account / legacy',
    mode: 'partial',
  },
  'outlook-new': {
    group: 'Selective color adjustment',
    label: 'Outlook · new Windows / web / iOS / Android',
    mode: 'partial',
    outlook: true,
  },
  'gmail-ios': {
    group: 'Full color adjustment',
    label: 'Gmail iOS · Google account',
    mode: 'full',
    lightOnly: true,
  },
  'gmail-ios-other': {
    group: 'Full color adjustment',
    label: 'Gmail iOS other / legacy · Outlook classic',
    mode: 'full',
  },
};

// Preserve shared/bookmarked URLs from before equivalent profiles were grouped.
const aliases: Record<string, string> = {
  'apple-ios': 'apple-macos',
  'outlook-macos': 'apple-macos',
  'gmail-mobile-web': 'gmail-web',
  'outlook-classic': 'gmail-ios-other',
  'outlook-web': 'outlook-new',
  'outlook-ios': 'outlook-new',
  'outlook-android': 'outlook-new',
};
export function resolveProfile(client: string | null): string {
  if (client && Object.hasOwn(profiles, client)) return client;
  if (client && Object.hasOwn(aliases, client)) return aliases[client]!;
  return 'apple-macos';
}

export function forceSchemeQuery(query: string, dark: boolean): string {
  return query.replace(
    /\(\s*prefers-color-scheme\s*:\s*(dark|light)\s*\)/gi,
    (_, scheme: string) =>
      (scheme.toLowerCase() === 'dark') === dark
        ? '(min-width: 0px)'
        : '(min-width: 999999px)',
  );
}

// An explicit heuristic, not a reimplementation of any proprietary algorithm.
// Mirror HSL lightness while preserving hue, saturation and alpha. Partial mode
// changes only light backgrounds / dark text and leaves dark surfaces alone.
export function adjustColor(
  color: string,
  background: boolean,
  full: boolean,
): string {
  const match =
    /^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:\s*[,/]\s*([\d.]+))?\s*\)$/.exec(
      color,
    );
  if (!match || Number(match[4] ?? 1) === 0) return color;
  const rgb = match.slice(1, 4).map(Number);
  const min = Math.min(...rgb),
    max = Math.max(...rgb);
  const light = (min + max) / 510;
  if (!full && (background ? light < 0.55 : light > 0.45)) return color;
  const offset = 255 - max - min;
  return `rgba(${rgb.map((c) => Math.round(c + offset)).join(', ')}, ${match[4] ?? 1})`;
}

// Restore previous preview mutations before applying a new appearance. A
// document can be reused by browser history or receive more than one load event.
const restoreDocuments = new WeakMap<Document, () => void>();

export function applyDarkMode(
  doc: Document,
  client: string,
  dark: boolean,
): string {
  restoreDocuments.get(doc)?.();
  const undo: Array<() => void> = [];
  const remembered = new WeakMap<Element, Set<string>>();
  function rememberAttribute(el: Element, name: string) {
    let names = remembered.get(el);
    if (!names) remembered.set(el, (names = new Set()));
    if (names.has(name)) return;
    names.add(name);
    const original = el.getAttribute(name);
    undo.push(() => {
      if (original === null) el.removeAttribute(name);
      else el.setAttribute(name, original);
    });
  }
  restoreDocuments.set(doc, () => {
    for (const restore of undo.toReversed()) restore();
  });
  const profile = profiles[resolveProfile(client)]!;
  const win = doc.defaultView!;
  // Read the document's opt-in before enforcing a scheme for this preview.
  const metas = [...doc.querySelectorAll<HTMLMetaElement>('meta[name]')];
  const schemes = metas
    .filter((m) => /^(supported-)?color-schemes?$/i.test(m.name))
    .map((m) => m.content.toLowerCase())
    .join(' ');
  const rootScheme = win.getComputedStyle(doc.documentElement).colorScheme;
  const optedIn = /\bdark\b/.test(schemes + ' ' + rootScheme);
  const optOut =
    !!profile.lightOnly &&
    metas.some(
      (m) =>
        m.name.toLowerCase() === 'color-scheme' &&
        /\blight\s+only\b/i.test(m.content),
    );
  const authored = dark && profile.mode === 'authored' && optedIn;
  // Force dark/light media conditions independently of the host OS, retaining
  // other conditions (including viewport widths) and nested grouping rules.
  function rewrite(rules: CSSRuleList) {
    for (const rule of rules) {
      if ('media' in rule) {
        const media = (rule as CSSMediaRule).media;
        const original = media.mediaText;
        undo.push(() => {
          media.mediaText = original;
        });
        media.mediaText = forceSchemeQuery(original, authored);
      }
      if ('cssRules' in rule) rewrite((rule as CSSGroupingRule).cssRules);
    }
  }
  for (const sheet of doc.styleSheets) {
    try {
      rewrite(sheet.cssRules);
    } catch {
      /* Cross-origin styles aren't inspectable. */
    }
  }
  for (const el of doc.querySelectorAll(
    'style[media], link[media], source[media]',
  )) {
    rememberAttribute(el, 'media');
    el.setAttribute(
      'media',
      forceSchemeQuery(el.getAttribute('media')!, authored),
    );
  }
  rememberAttribute(doc.documentElement, 'style');
  doc.documentElement.style.setProperty(
    'color-scheme',
    authored ? 'dark' : 'only light',
    'important',
  );
  if (!dark) return 'Light appearance';
  if (profile.mode === 'authored') {
    return optedIn
      ? 'Authored dark CSS · browser preview, not the actual mail engine'
      : 'No dark color-scheme opt-in found · keeping the email light';
  }
  if (profile.mode === 'unchanged')
    return 'Web profile · email colors unchanged; app chrome is dark';
  if (optOut)
    return 'Google account profile · light-only meta tag keeps the email light';

  // Snapshot before mutation so inherited colors are transformed only once.
  // Images, background images and gradients are intentionally not filtered.
  const properties = [
    'background-color',
    'color',
    'border-top-color',
    'border-right-color',
    'border-bottom-color',
    'border-left-color',
    'text-decoration-color',
  ];
  const elements = [...doc.querySelectorAll<HTMLElement>('*')].filter(
    (el) =>
      ![
        'IMG',
        'SVG',
        'PATH',
        'STYLE',
        'SCRIPT',
        'META',
        'LINK',
        'HEAD',
      ].includes(el.tagName) && !el.closest('svg'),
  );
  const snapshots = elements.map((el) => {
    const computed = win.getComputedStyle(el);
    return { el, colors: properties.map((p) => computed.getPropertyValue(p)) };
  });
  for (const { el, colors } of snapshots) {
    rememberAttribute(el, 'style');
    if (profile.outlook) {
      rememberAttribute(el, 'data-ogsc');
      rememberAttribute(el, 'data-ogsb');
      el.setAttribute('data-ogsc', colors[1]!);
      el.setAttribute('data-ogsb', colors[0]!);
    }
    properties.forEach((property, i) => {
      const original = colors[i]!;
      const adjusted = adjustColor(
        original,
        property === 'background-color',
        profile.mode === 'full',
      );
      if (adjusted !== original) el.style.setProperty(property, adjusted);
    });
  }
  // Give transparent documents the same baseline as a white email canvas.
  if (
    win.getComputedStyle(doc.documentElement).backgroundColor ===
    'rgba(0, 0, 0, 0)'
  ) {
    doc.documentElement.style.backgroundColor = '#1b1b1b';
  }
  return `${profile.mode === 'full' ? 'Full' : 'Selective'} color adjustment · approximation; images and gradients unchanged`;
}
