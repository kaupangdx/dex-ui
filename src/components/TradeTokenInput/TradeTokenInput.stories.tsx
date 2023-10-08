import type { Meta, StoryObj } from "@storybook/react";
import { TradeTokenInput } from "./TradeTokenInput";
import { Box, Flex } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useRef } from "react";

const meta: Meta<typeof TradeTokenInput> = {
  component: TradeTokenInput,
  argTypes: {},
};

interface StoryFormFields {
  tokenIn: string;
  tokenInAmount: string | null;
}

export default meta;
type Story = StoryObj<typeof TradeTokenInput>;
export const Default: Story = {
  render: (args) => {
    const form = useForm<StoryFormFields>({
      initialValues: {
        tokenIn: "0",
        tokenInAmount: "",
      },
    });

    const tokenSelectorPortal = useRef<HTMLDivElement>(null);

    return (
      <Flex justify={"center"}>
        <div ref={tokenSelectorPortal}></div>
        <Box maw={"400px"} mt={"xl"}>
          <TradeTokenInput
            {...args}
            form={form}
            tokenSelectorName={"tokenIn"}
            tokenInmountName={"tokenInAmount"}
            tokenSelectorPortal={tokenSelectorPortal.current!}
          />
        </Box>
      </Flex>
    );
  },
};
