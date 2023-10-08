import React, { useCallback, useMemo } from "react";
import {
  ActionIcon,
  Anchor,
  AppShellProps,
  Avatar,
  Badge,
  Box,
  Button,
  Card,
  Center,
  CloseButton,
  Container,
  Divider,
  Flex,
  Footer,
  Group,
  Header,
  Image,
  Input,
  Loader,
  AppShell as MantineAppShell,
  NativeSelect,
  NavLink,
  NumberInput,
  Overlay,
  Paper,
  Popover,
  Skeleton,
  Space,
  Stack,
  Text,
  ThemeIcon,
  Title,
  Tooltip,
  createStyles,
} from "@mantine/core";
import { AccountStore } from "../../store/useAccountStore";
import { IconExternalLink, IconWallet } from "@tabler/icons-react";
import Truncate from "react-truncate-inside/es";
import { useFormatBalance } from "../../hooks/balances/useFormatBalance";

export interface WalletButtonProps {
  status: AccountStore["status"];
  address?: string;
  balance: {
    loading: boolean;
    value?: string;
  };
  usdPricePerUnit: {
    loading: boolean;
    value?: string;
  };
  onConnectAccount: () => void;
}

export const getText = (status: AccountStore["status"]) => {
  const defaultText = "Connect wallet";
  switch (status) {
    case "not-installed":
      return "Install wallet";
    default:
      return defaultText;
  }
};

export const WalletButton: React.FC<WalletButtonProps> = ({
  status,
  address,
  balance,
  usdPricePerUnit,
  onConnectAccount,
}) => {
  const priceLoading = balance.loading || usdPricePerUnit.loading;
  const shouldShowAddress = useMemo(
    () => status === "connected" && address,
    [status, address]
  );

  const handleOnClick = useCallback(() => {
    if (status === "connected" || status === "installed") {
      return onConnectAccount();
    }

    if (status === "not-installed") {
      window.open("https://www.aurowallet.com/", "_blank");
    }
  }, [status]);

  const formatBalance = useFormatBalance();

  return (
    <Group>
      {shouldShowAddress ? (
        <>
          <Stack
            spacing={"0.1rem"}
            align={"end"}
            sx={{ minWidth: "100px", textAlign: "right" }}
          >
            <Skeleton visible={priceLoading}>
              <Text size={"xs"} weight={"bold"}>
                {formatBalance(balance.value) ?? "0"} MINA
              </Text>
            </Skeleton>
            <Skeleton visible={priceLoading} h={"80%"}>
              <Tooltip
                label="Support for USD conversion comming soon"
                openDelay={300}
              >
                <Text size={"xs"} color={"dimmed"} sx={{ lineHeight: 1 }}>
                  {/* 500$ */}- $
                </Text>
              </Tooltip>
            </Skeleton>
          </Stack>
        </>
      ) : (
        <></>
      )}
      <Tooltip label={"Reconnect account"} hidden={status !== "connected"}>
        <Button
          size={"md"}
          mah={"42px"}
          variant={"light"}
          loading={status === "loading"}
          leftIcon={
            status === "not-installed" ? (
              <IconExternalLink size={"1.25rem"} />
            ) : (
              <IconWallet size={"1.25rem"} />
            )
          }
          onClick={handleOnClick}
        >
          {shouldShowAddress ? (
            <Truncate width={180} offset={9} text={address} />
          ) : (
            getText(status)
          )}
        </Button>
      </Tooltip>
    </Group>
  );
};
