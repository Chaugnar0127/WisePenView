import type { Meta, StoryObj } from '@storybook/react-vite';

import { ServicesProvider } from '@/domains';

import UserCheckIn from './index';

const meta = {
  title: 'Sidebar/UserCheckIn',
  component: UserCheckIn,
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <ServicesProvider>
        <div style={{ padding: 24 }}>
          <Story />
        </div>
      </ServicesProvider>
    ),
  ],
} satisfies Meta<typeof UserCheckIn>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
