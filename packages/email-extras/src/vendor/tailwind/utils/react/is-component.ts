// Vendored from resend/react-email; edit the sync script, not this file.
import type * as React from 'preact/compat';
import { elementMarker } from '../../../element-marker.js';

export const isComponent = (
  element: React.ReactElement,
): boolean => {
  return (
    (typeof element.type === 'function' ||
      // @ts-expect-error - we know this is a component that may have a render function
      element.type.render !== undefined) &&
    !(elementMarker in (element.type as object))
  );
};
