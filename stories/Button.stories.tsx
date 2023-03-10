// Button.stories.ts|tsx

import Button from '@common/components/primitives/Button';
import { ComponentMeta, ComponentStory } from '@storybook/react';

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
