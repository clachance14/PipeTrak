import type { Meta, StoryObj } from "@storybook/react";

import { Button } from "@components";

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
    label: "Button",
    isLoading: false,
    isDisabled: false,
    size: "medium",
  },
  render: ({ label, ...args }) => <Button {...args}>{label}</Button>,
};
