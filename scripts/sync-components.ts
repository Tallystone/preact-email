import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  mkdir,
  readFile,
  readdir,
  writeFile,
  copyFile,
  rm,
} from "node:fs/promises";
import { join, resolve } from "node:path";

// Deliberately pinned; the update workflow changes this and the comparison version together.
const commit = "e0561e164e9c28859d24373804e30b364931ee77";
const root = JSON.parse(await readFile('package.json', 'utf8'));
const version: string = root.devDependencies['react-email'];
const source = resolve(process.argv[2] ?? "/tmp/react-email-upstream");
if (
  execFileSync("git", ["-C", source, "rev-parse", "HEAD"], {
    encoding: "utf8",
  }).trim() !== commit
) {
  throw new Error(
    `Expected React Email source at ${commit}. See README for checkout instructions.`,
  );
}
if (
  execFileSync(
    "git",
    [
      "-C",
      source,
      "status",
      "--porcelain",
      "--untracked-files=all",
      "--",
      "packages/react-email/src/components",
      "LICENSE.md",
    ],
    { encoding: "utf8" },
  ).trim()
) {
  throw new Error("Component source checkout must be clean before syncing");
}
const upstreamPackage = JSON.parse(await readFile(join(source, 'packages/react-email/package.json'), 'utf8'));
if (upstreamPackage.version !== version) throw new Error(`Upstream package version does not match ${version}`);
const components = [
  "body",
  "button",
  "code-inline",
  "column",
  "container",
  "font",
  "head",
  "heading",
  "hr",
  "html",
  "img",
  "link",
  "preview",
  "row",
  "section",
  "text",
];
const base = join(source, "packages/react-email/src/components");
let target = resolve("packages/email/src/vendor");
const hashes: Record<string, string> = {};
async function copy(relative: string): Promise<void> {
  const input = await readFile(join(base, relative), "utf8");
  hashes[relative] = createHash("sha256").update(input).digest("hex");
  // Keep upstream implementation, using Preact's forwardRef and React-compatible types.
  let output = input.replaceAll("'react'", "'preact/compat'");
  output = output.replace(
    /React.ComponentPropsWithoutRef<('[^']+')>/g,
    "Omit<React.ComponentPropsWithoutRef<$1>, 'style'> & { style?: React.CSSProperties }",
  );
  // Preact 11's compat prop helpers flatten intrinsic accessibility unions.
  if (relative === "img/img.tsx") {
    output = output.replace("React.ComponentPropsWithoutRef<'img'>", "React.ImgHTMLAttributes<HTMLImageElement>");
    // Assert the final intrinsic props together: Img supplies its own alt fallback,
    // while Preact's accessibility union cannot express all upstream role combinations.
    output = output.replace(
      "<img\n      {...props}\n      alt={alt ?? ''}\n      height={height}\n      ref={ref}\n      src={src}\n      style={{",
      "<img {...{ ...props, alt: alt ?? '', height, ref, src, style: {",
    ).replace("      }}\n      width={width}\n    />", "      }, width } as React.ComponentProps<'img'>} />");
  }
  if (relative === "link/link.tsx" || relative === "button/button.tsx") {
    output = output.replace("{...props}", "{...(props as React.ComponentProps<'a'>)}");
  }
  output = output.replace(
    "React.HtmlHTMLAttributes<HTMLBodyElement>",
    "Omit<React.HTMLAttributes<HTMLBodyElement>, 'style'> & { style?: React.CSSProperties }",
  );
  if (
    [
      "body/margin-properties.ts",
      "heading/utils/as.ts",
      "markdown/styles.ts",
      "markdown/utils/parse-css-in-js-to-inline-css.ts",
    ].includes(relative)
  )
    output = "import type * as React from 'preact/compat';\n" + output;
  output = output.replace(
    /React.ComponentPropsWithRef<(\w+)>/g,
    "Omit<React.ComponentPropsWithRef<$1>, 'style'> & { style?: React.CSSProperties }",
  );
  output = output.replaceAll(
    "string | number | undefined",
    "string | number | null | undefined",
  );
  output = output.replaceAll(
    "(keyof React.CSSProperties)[]",
    "(Extract<keyof React.CSSProperties, string>)[]",
  );
  output = output.replace(
    "extends Omit<React.ComponentPropsWithoutRef<'pre'>, 'style'> & { style?: React.CSSProperties } {",
    "extends Omit<React.ComponentPropsWithoutRef<'pre'>, 'style'> {\n  style?: React.CSSProperties;",
  );
  if (output.includes("React.isValidElement<")) {
    output =
      "import { isValidElement as isVNode, type VNode } from 'preact';\nfunction isValidElement<P>(value: unknown): value is VNode<P> { return isVNode(value); }\n" +
      output.replaceAll("React.isValidElement<", "isValidElement<");
  }
  if (relative === "tailwind/utils/react/is-component.ts") {
    output =
      "import type * as React from 'preact/compat';\n" +
      output.replace(
        "element is React.ReactElement<unknown, React.FC<unknown>>",
        "boolean",
      );
  }
  // css-tree 3.x types now include these nodes; upstream's 2.x shim conflicts.
  if (relative === "tailwind/utils/css/downlevel-for-email-clients.ts") {
    output = output.replace(/\/\*\*\n \* css-tree 3\.x introduced[\s\S]*?declare module 'css-tree' \{[\s\S]*?\n\}\n/, "");
  }
  output = output.replace(
    "enter(originalNode, item)",
    "enter(originalNode: CssNode, item: ListItem<CssNode> | null)",
  );
  output = output
    .replaceAll("enter(node) {", "enter(node: CssNode) {")
    .replaceAll("leave(node) {", "leave(node: CssNode) {");
  // This capture is guaranteed by the preceding regex match; TS cannot infer it.
  output = output.replace(
    "Number.parseFloat(matches[1])",
    "Number.parseFloat(matches[1]!)",
  );
  await mkdir(join(target, relative, ".."), { recursive: true });
  await writeFile(
    join(target, relative),
    "// Vendored from resend/react-email; edit the sync script, not this file.\n" +
      output,
  );
}
async function walk(relative: string): Promise<void> {
  for (const entry of await readdir(join(base, relative), {
    withFileTypes: true,
  })) {
    if (entry.name === "e2e" || entry.name === "__snapshots__") continue;
    const path = join(relative, entry.name);
    if (entry.isDirectory()) await walk(path);
    else if (/\.tsx?$/.test(entry.name) && !/\.(spec|test)\./.test(entry.name))
      await copy(path);
  }
}
await rm(target, { recursive: true, force: true });
for (const component of components) await walk(component);
await copy("element-marker.ts");
await writeFile(
  join(target, "index.ts"),
  components.map((c) => `export * from './${c}/index.js';`).join("\n") + "\n",
);
const optionalComponents = ["markdown", "code-block", "tailwind"];
const patches = [
  "React runtime imports, CSS augmentation and missing type imports -> preact/compat",
  "narrow component styles to CSS objects; preserve nullable Preact CSS values",
  "narrow CSS property keys to strings",
  "Preact VNode type guards and component predicate types",
  "explicit css-tree visitor parameter types",
  "remove obsolete css-tree 2.x query node augmentation",
  "adapt image and anchor props to Preact 11 intrinsic types",
  "guarded regex capture non-null assertion",
];
async function manifest(packageDir: string, included: string[], marker: boolean) {
  await copyFile(join(source, "LICENSE.md"), join(packageDir, "LICENSE.react-email"));
  await writeFile(join(packageDir, "vendor-manifest.json"), JSON.stringify({
    repository: "https://github.com/resend/react-email", commit, version,
    components: included, optionalComponents: [], patches,
    sha256: Object.fromEntries(Object.entries(hashes).filter(([file]) =>
      included.some(component => file.startsWith(component + "/")) || (marker && file === "element-marker.ts"))),
  }, null, 2) + "\n");
}
await manifest("packages/email", components, true);
for (const component of optionalComponents) {
  const packageDir = "packages/email-" + component;
  target = resolve(packageDir, "src/vendor");
  await rm(target, { recursive: true, force: true });
  await walk(component);
  if (component !== "markdown") await copy("element-marker.ts");
  await manifest(packageDir, [component], component !== "markdown");
}
console.log(`Synced ${Object.keys(hashes).length} component source files at ${commit}`);
