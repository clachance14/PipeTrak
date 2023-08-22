import type { Meta, StoryObj } from "@storybook/react";

import { Hint, Icon } from "@ui/components";

const meta = {
  title: "Base/Hint",
  parameters: {
    layout: "centered",
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => {
    return (
      <Hint
        icon={Icon.info}
        title="Hello world"
        message="This is my amazing hint message."
      />
    );
  },
};
