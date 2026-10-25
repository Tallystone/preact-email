import type { Plugin } from 'esbuild';

// React Email's preview UI renders React elements. Compile these same fixtures
// with upstream components, as the React side of the parity suite does.
export default [
  {
    name: 'preact-email-fixtures-in-react-email-preview',
    setup(build) {
      build.initialOptions.alias = {
        ...build.initialOptions.alias,
        '@hillac/preact-email': 'react-email',
      };
      // Preserve the UI's instrumented React JSX runtime when it supplies one.
      // The CLI export command has no runtime override and would otherwise
      // inherit jsxImportSource: preact from our workspace tsconfig.
      if (
        !build.initialOptions.jsxImportSource ||
        build.initialOptions.jsxImportSource === 'preact'
      ) {
        build.initialOptions.jsxImportSource = 'react';
      }
    },
  },
] satisfies Plugin[];
