import { render, type ComponentChild } from 'preact';

/** Creates a React-compatible root backed by Preact's render API. */
export function createRoot(container: Element) {
  return {
    render(children: ComponentChild) {
      render(children, container);
    },
    unmount() {
      render(null, container);
    },
  };
}

export default { createRoot };
