import type { Meta, StoryObj } from "@storybook/react";
import { AppShell } from "./AppShell";
import { Header } from "../Header/Header";
import { WalletButton } from "../WalletButton/WalletButton";
import { Footer } from "../Footer/Footer";

const meta: Meta<typeof AppShell> = {
  component: AppShell,
  args: {
    footer: <Footer loading={false} countdown={0} />,
    header: (
      <Header
        onMintTestFunds={() => {}}
        onToggleTheme={() => {}}
        walletStatus="installed"
        walletButton={
          <WalletButton
            onConnectAccount={() => {}}
            status={"installed"}
            // address="B62qmeMDp3AafAcYHGhBtx9UhTuqKCgyqLAWjcEED6Q1mGwJ6W14Zr6"
            balance={{
              loading: false,
            }}
            usdPricePerUnit={{
              loading: false,
              value: "0.5",
            }}
          />
        }
      />
    ),
  },
};

export default meta;
type Story = StoryObj<typeof AppShell>;
export const Default: Story = {};
