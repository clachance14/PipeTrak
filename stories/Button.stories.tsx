// Button.stories.ts|tsx

import { ComponentMeta, ComponentStory } from '@storybook/react';

import { Button } from '@common/client';

export default {
  title: 'Button',
  component: Button,
  argTypes: {
    intent: {
      control: {
        type: 'select',
        options: ['primary', 'primary-outline', 'primary-ghost', 'secondary', 'github', 'discord', 'google', 'apple'],
      },
    },
  },
} as ComponentMeta<typeof Button>;

export const Primary: ComponentStory<typeof Button> = (args) => <Button {...args}>Button</Button>;

Primary.args = {
  intent: 'primary',
  size: 'medium',
};
