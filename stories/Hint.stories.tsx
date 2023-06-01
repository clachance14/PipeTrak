import type { Meta, StoryObj } from '@storybook/react';
import { Hint } from '@ui/components';

const meta: Meta<typeof Hint> = {
  title: 'supastarter UI/Hint',
  component: Hint,
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof Hint>;

export const hint: Story = {
  args: {
    status: 'success',
    title: 'Hint title',
    message: 'This is my message',
  },
};
