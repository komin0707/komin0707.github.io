import type { Preview } from '@storybook/react-vite';
import '../src/styles/global.css';
import '../src/App.css';
import '../src/App.responsive.css';

const preview: Preview = {
  parameters: {
    controls: {
      expanded: true,
    },
    layout: 'fullscreen',
  },
};

export default preview;
