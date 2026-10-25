# Test emails

Run `pnpm preview` from the repository root, then open http://localhost:3000.

Each TSX file exports a default email, `PreviewProps`, and named `scenarios`. Shared layouts live in `components/`; local images live in `assets/`.

`pnpm check` compares rendered HTML and exact plain text against React Email. `BENCH_CORPUS=tsx pnpm bench` benchmarks these templates and updates the root README.
