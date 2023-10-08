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
  Footer as MantineFooter,
  Group,
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
import { useTheme } from "@emotion/react";
export interface FooterProps {
  loading: boolean;
  blockHeight?: string;
  countdown: number;
}
export const Footer: React.FC<FooterProps> = ({
  loading,
  blockHeight,
  countdown,
}) => {
  const { colorScheme } = useMantineTheme();
  return (
    <MantineFooter
      fixed={false}
      height={"4rem"}
      mih={"4rem"}
      withBorder={true}
      styles={{
        root: {
          zIndex: 0,
        },
      }}
      bg={colorScheme === "light" ? "gray.0" : "dark.7"}
    >
      <Container size={"lg"} h={"100%"}>
        <Flex justify={"space-between"} h={"100%"} align={"center"}>
          <Text color={"dimmed"} size={"sm"} lh={"1"}>
            Powered by <br />{" "}
            <Anchor href="https://twitter.com/proto_kit" target="_blank">
              @proto_kit
            </Anchor>
          </Text>
          <Group align={"center"} h={"fit-content"} spacing={"xs"}>
            <Group spacing={"0.35rem"}>
              <Loader
                sx={{ opacity: loading ? 1 : 0 }}
                size={"0.85rem"}
                color={colorScheme === "light" ? "gray" : "white"}
              ></Loader>
              <Text size={"xs"}>{countdown ?? "0"}s</Text>
            </Group>
            <Divider orientation={"vertical"} />

            <Badge color={"teal"} variant={"dot"} size={"md"}>
              {`#${blockHeight ?? "0"}`}
            </Badge>
          </Group>
          <Group color={"gray"}>
            <Anchor
              color={"gray"}
              href="https://github.com/kaupangdx"
              target="_blank"
            >
              <IconBrandGithubFilled />
            </Anchor>
            <Anchor
              color={"gray"}
              href="https://twitter.com/kaupangdx"
              target="_blank"
            >
              <IconBrandTwitterFilled />
            </Anchor>
            {/* <Anchor
              color={"gray"}
              href="https://discord.gg/dhBz4pbszf"
              target="_blank"
            >
              <IconBrandDiscordFilled />
            </Anchor> */}
          </Group>
        </Flex>
      </Container>
    </MantineFooter>
  );
};
