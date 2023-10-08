import React, { PropsWithChildren, ReactNode, useRef, useState } from "react";
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
  Header as MantineHeader,
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
  Space,
  Stack,
  Text,
  ThemeIcon,
  Title,
  Tooltip,
  createStyles,
  useMantineColorScheme,
  useMantineTheme,
} from "@mantine/core";

import kaupangIcon from "./kaupang.png";
import {
  IconAlertTriangle,
  IconArrowDown,
  IconArrowsDownUp,
  IconBrandDiscordFilled,
  IconBrandGithubFilled,
  IconBrandTwitter,
  IconBrandTwitterFilled,
  IconChevronLeft,
  IconCoins,
  IconMoneybag,
  IconMoon,
  IconQuestionMark,
  IconSearch,
  IconSettings,
  IconSun,
} from "@tabler/icons-react";
import { WalletButton } from "../WalletButton/WalletButton";
import { AccountStore } from "../../store/useAccountStore";

export interface HeaderProps {
  walletStatus: AccountStore["status"];
  walletButton: ReactNode;
  onToggleTheme: () => void;
  onMintTestFunds: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  walletStatus,
  walletButton,
  onMintTestFunds,
  onToggleTheme,
}) => {
  const { colorScheme } = useMantineTheme();
  return (
    <Stack spacing={0} sx={{ zIndex: 0 }}>
      <Flex bg={"violet"}>
        <Container size={"xl"}>
          <Center p={"md"}>
            <Text color={"violet.0"}>
              Welcome to the Kaupang DX sandbox, all displayed funds are for
              testing purposes only.{" "}
            </Text>
          </Center>
        </Container>
      </Flex>
      <MantineHeader height={66}>
        <Container size={"lg"} h={"100%"}>
          <Flex justify={"space-between"} align={"center"} h={"100%"}>
            <Flex>
              <Group spacing={"sm"} align={"center"}>
                {/* <Image maw={"40px"} mx={"auto"} src={kaupangIcon} /> */}
                <Title
                  transform={"uppercase"}
                  weight={"bold"}
                  order={4}
                  ff={"Montserrat"}
                >
                  Kaupang DX
                </Title>
              </Group>
            </Flex>
            <Group>
              {walletButton}
              <Group spacing={"xs"}>
                <Tooltip label={"Get test tokens"}>
                  <ActionIcon
                    disabled={walletStatus !== "connected"}
                    onClick={onMintTestFunds}
                    size={"lg"}
                    variant={"light"}
                    color={"gray"}
                    maw={"42px"}
                    mah={"42px"}
                    h={"42px"}
                    w={"42px"}
                  >
                    <IconCoins size={"1.35rem"} />
                  </ActionIcon>
                </Tooltip>
                <Tooltip
                  label={
                    colorScheme === "light"
                      ? "Switch to dark theme"
                      : "Switch to light theme"
                  }
                >
                  <ActionIcon
                    onClick={onToggleTheme}
                    size={"lg"}
                    variant={"light"}
                    color={"gray"}
                    maw={"42px"}
                    mah={"42px"}
                    h={"42px"}
                    w={"42px"}
                  >
                    {colorScheme === "light" ? (
                      <IconMoon size={"1.35rem"} />
                    ) : (
                      <IconSun size={"1.35rem"} />
                    )}
                  </ActionIcon>
                </Tooltip>
              </Group>
            </Group>
          </Flex>
        </Container>
      </MantineHeader>
    </Stack>
  );
};
