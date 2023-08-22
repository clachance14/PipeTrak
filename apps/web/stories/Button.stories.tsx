import type { Meta, StoryObj } from "@storybook/react";

import { Button } from "@ui/components";

// More on how to set up stories at: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
const meta = {
  title: "Base/Button",
  component: Button,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: "Button",
    disabled: false,
  },
  render: ({ children, ...args }) => <Button {...args}>{children}</Button>,
};
