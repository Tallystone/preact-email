# Test emails

Run `pnpm preview` from the repository root, then open http://localhost:3000.

Each TSX file exports a default email. `.PreviewProps`, `.Scenarios`, `.Subject`, and `.Schema` are optional. Shared layouts live in `components/`; local images live in `assets/`.

`component-showcase.tsx` covers all components, including Markdown, CodeBlock and Tailwind. `image-receipt.tsx` exercises image accessibility props with no metadata; checkout uses Zod.

`pnpm check` compares rendered HTML and exact plain text against React Email. `BENCH_CORPUS=tsx pnpm bench` benchmarks these templates and updates the root README.
