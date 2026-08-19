/* eslint-disable react-refresh/only-export-components */
import '@/i18n';
import { THEME_MODE, ThemeApplier } from '@/theme';
import '@fontsource-variable/noto-sans-sc/wght.css';
import type { Preview } from '@storybook/react-vite';
import type { ReactNode } from 'react';

import '../src/bootstrap/index.css';
import '../src/bootstrap/scrollbar.less';

function StorybookThemeDecorator(Story: () => ReactNode) {
  return (
    <ThemeApplier defaultTheme={THEME_MODE.LIGHT}>
      <Story />
    </ThemeApplier>
  );
}

const preview: Preview = {
  decorators: [StorybookThemeDecorator],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    layout: 'centered',
  },
};

export default preview;
