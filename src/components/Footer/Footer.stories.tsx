import type { Meta, StoryObj } from "@storybook/react";
import { Footer } from "./Footer";

const meta: Meta<typeof Footer> = {
  component: Footer,
  args: {
    countdown: 10,
    blockHeight: "1000",
    loading: true,
  },
};

export default meta;
type Story = StoryObj<typeof Footer>;
export const Default: Story = {};
