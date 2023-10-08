import type { Meta, StoryObj } from "@storybook/react";
import { Header } from "./Header";
import { WalletButton } from "../WalletButton/WalletButton";

const meta: Meta<typeof Header> = {
  component: Header,
  args: {
    walletStatus: "connected",
    walletButton: (
      <WalletButton
        onConnectAccount={() => {}}
        status={"connected"}
        address="B62qmeMDp3AafAcYHGhBtx9UhTuqKCgyqLAWjcEED6Q1mGwJ6W14Zr6"
        balance={{
          loading: false,
        }}
        usdPricePerUnit={{
          loading: false,
          value: "0.5",
        }}
      />
    ),
  },
  argTypes: {
    onMintTestFunds: {
      type: "function",
    },
    onToggleTheme: {
      type: "function",
    },
  },
};

export default meta;
type Story = StoryObj<typeof Header>;
export const Default: Story = {};
export const DisconnectedWallet: Story = {
  args: {
    walletStatus: "initial",
    walletButton: (
      <WalletButton
        onConnectAccount={() => {}}
        status={"initial"}
        balance={{
          loading: false,
        }}
        usdPricePerUnit={{
          loading: false,
          value: "0.5",
        }}
      />
    ),
  },
};
