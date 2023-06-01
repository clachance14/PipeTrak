import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '@ui/components';

const meta: Meta<typeof Button> = {
  title: 'supastarter UI/Button',
  component: Button,
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof Button>;

export const button: Story = {
  argTypes: {
    children: {
      type: 'string',
      name: 'Label',
    },
    intent: {
      name: 'Intent',
    },
    size: {
      name: 'Size',
    },
    isLoading: {
      name: 'Loading',
    },
    isDisabled: {
      name: 'Disabled',
    },
  },
  args: {
    children: 'Button',
    intent: 'primary',
    size: 'medium',
    isLoading: false,
    isDisabled: false,
  },
};
