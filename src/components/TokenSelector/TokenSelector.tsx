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
  PortalProps,
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
import { tokens } from "../../tokens";

interface TokenSelectorProps {
  onClose: () => void;
  onSelect: (tokenId: string) => void;
}

export const TokenSelector: React.FC<TokenSelectorProps> = ({
  onClose,
  onSelect,
}) => {
  const { colorScheme } = useMantineTheme();

  return (
    <Overlay
      // opacity={0.5}
      // blur={50}
      blur={5}
      p={"lg"}
      bg={
        colorScheme === "light"
          ? "rgba(255,255,255, .97)"
          : "rgba(26, 27, 30, 1)"
      }
    >
      <Stack spacing={"xl"}>
        <Flex align={"center"} gap={"xs"} sx={{ position: "relative" }}>
          <ActionIcon
            onClick={() => onClose()}
            size={"lg"}
            sx={(theme) => ({
              position: "absolute",
              top: "-1px",
              zIndex: 1,
            })}
          >
            <IconChevronLeft size={"1.55rem"} />
          </ActionIcon>
          <Title order={3} w={"100%"} align={"center"}>
            Select token
          </Title>
        </Flex>
        <Stack spacing={"sm"}>
          {/* <Input
            size={"md"}
            rightSection={<IconSearch size={"1.15rem"} opacity={0.5} />}
            type={"text"}
            placeholder={"Find token by name"}
          /> */}
          <Stack>
            {Object.values(tokens).map((token, i) => (
              <Paper
                key={i}
                onClick={() => {
                  onSelect(token.id);
                  onClose();
                }}
                radius={"md"}
                withBorder
                p={"sm"}
                sx={(theme) => ({
                  ":hover": {
                    cursor: "pointer",
                    borderColor: theme.colors.violet[6],
                  },
                })}
              >
                <Group spacing={"md"}>
                  <Avatar radius={"xl"} maw={"2rem"} size={"lg"}>
                    {token.logo ? (
                      <Image radius={"xl"} src={token.logo} />
                    ) : (
                      <IconQuestionMark size={"1.75rem"} />
                    )}
                  </Avatar>
                  <Stack spacing={0}>
                    <Text size={"md"}>{token.ticker}</Text>
                    <Text color={"dimmed"} size={"sm"}>
                      {token.name}
                    </Text>
                  </Stack>
                </Group>
              </Paper>
            ))}
          </Stack>
        </Stack>
      </Stack>
    </Overlay>
  );
};
