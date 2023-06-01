import type { Meta, StoryObj } from '@storybook/react';
import { Input } from '@ui/components';

const meta: Meta<typeof Input> = {
  title: 'supastarter UI/Input',
  component: Input,
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof Input>;

export const input: Story = {};
