import type { Meta, StoryObj } from "@storybook/react";
import { TradeForm } from "./TradeForm";
import { Box, Container, Flex } from "@mantine/core";
import { useForm } from "@mantine/form";

interface StoryFormFields {
  tokenIn: string;
  tokenInAmount: string;
  tokenOut: string;
  tokenOutAmount: string;
}

const meta: Meta<typeof TradeForm> = {
  component: TradeForm,
  argTypes: {},
  render: (args) => {
    return (
      <Container size={"xs"} pt={"xl"}>
        <TradeForm {...args} />
      </Container>
    );
  },
};

export default meta;
type Story = StoryObj<typeof TradeForm>;
export const Default: Story = {};
