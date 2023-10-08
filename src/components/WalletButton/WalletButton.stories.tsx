import type { Meta, StoryObj } from "@storybook/react";
import { WalletButton } from "./WalletButton";

const meta: Meta<typeof WalletButton> = {
  component: WalletButton,
  args: {
    balance: {
      loading: false,
      value: `${10000 * (10 ^ 6)}`,
    },
    usdPricePerUnit: {
      loading: false,
      value: "0.5",
    },
    status: "connected",
    address: "B62qmeMDp3AafAcYHGhBtx9UhTuqKCgyqLAWjcEED6Q1mGwJ6W14Zr6",
  },
  argTypes: {
    onConnectAccount: { type: "function" },
  },
};

export default meta;
type Story = StoryObj<typeof WalletButton>;
export const Default: Story = {};

export const NotInstalled: Story = {
  args: {
    status: "not-installed",
    address: undefined,
  },
};

export const Loading: Story = {
  args: {
    status: "loading",
    address: undefined,
  },
};

export const LoadingWithAddress: Story = {
  args: {
    status: "loading",
    balance: {
      loading: true,
    },
    usdPricePerUnit: {
      loading: true,
    },
  },
};

export const BalancesLoading: Story = {
  args: {
    status: "connected",
    balance: {
      loading: true,
    },
    usdPricePerUnit: {
      loading: true,
    },
  },
};
