import React, {
  PropsWithChildren,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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
  Collapse,
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
  Skeleton,
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
  IconChevronDown,
  IconChevronLeft,
  IconChevronUp,
  IconCoins,
  IconMoneybag,
  IconMoon,
  IconQuestionMark,
  IconSearch,
  IconSettings,
  IconSun,
} from "@tabler/icons-react";
import { TradeTokenInput } from "../TradeTokenInput/TradeTokenInput";
import { UseFormReturnType, useForm } from "@mantine/form";
import { TokenSelector } from "../TokenSelector/TokenSelector";
import { useDisclosure } from "@mantine/hooks";
import BigNumber from "bignumber.js";
import { useFormatBalance } from "../../hooks/balances/useFormatBalance";
import { tokens } from "../../tokens";

export interface TradeFormFields {
  tokenIn?: string;
  tokenOut?: string;
  tokenInAmount: string;
  tokenOutAmount: string;
  allowedSlippage: number;
}

export interface TradeFormProps {
  form: UseFormReturnType<TradeFormFields>;
  balanceA: {
    value?: string;
    loading: boolean;
  };
  balanceB: {
    value?: string;
    loading: boolean;
  };
  userBalanceA: {
    value?: string;
    loading: boolean;
  };
  userBalanceB: {
    value?: string;
    loading: boolean;
  };
  tradeType: "buy" | "sell";
  onSwitchTokens: () => void;
  onSubmit: (tradeLimit: string, fields: TradeFormFields) => void;
}

export const defaultAllowedSlippage = 10;
export const TradeForm: React.FC<TradeFormProps> = ({
  form,
  balanceA,
  balanceB,
  tradeType,
  onSwitchTokens,
  onSubmit,
  userBalanceA,
  userBalanceB,
}) => {
  const { colorScheme } = useMantineTheme();
  const [showDetails, { toggle: toggleDetails }] = useDisclosure();
  const formatBalance = useFormatBalance({
    withDecimals: false,
  });

  const formatBalanceDecimals = useFormatBalance({
    withDecimals: true,
  });

  const tokenSelectorPortal = useRef<HTMLDivElement>(null);

  const handleSwitchTokens = useCallback(() => {
    onSwitchTokens();
  }, [onSwitchTokens]);

  const spotPrice = useMemo(() => {
    if (!balanceA.value || !balanceB.value) return;

    return {
      aToB: formatBalance(new BigNumber(balanceA.value).div(balanceB.value)),
      bToA: formatBalance(new BigNumber(balanceB.value).div(balanceA.value)),
    };
  }, [balanceA, balanceB, form.values.tokenIn, form.values.tokenOut]);

  const tradePrice = useMemo(() => {
    if (tradeType === "sell") {
      const tradePrice = new BigNumber(form.values.tokenOutAmount).div(
        form.values.tokenInAmount
      );
      return formatBalance(tradePrice);
    }

    if (tradeType === "buy") {
      return formatBalance(
        new BigNumber(form.values.tokenInAmount).div(form.values.tokenOutAmount)
      );
    }
  }, [tradeType, form.values.tokenInAmount, form.values.tokenOutAmount]);

  const tradeLimit = useMemo(() => {
    if (tradeType === "sell") {
      return formatBalance(
        new BigNumber(form.values.tokenOutAmount).multipliedBy(
          1 - form.values.allowedSlippage / 100
        )
      );
    }

    if (tradeType === "buy") {
      return formatBalance(
        new BigNumber(form.values.tokenInAmount).multipliedBy(
          1 + form.values.allowedSlippage / 100
        )
      );
    }
  }, [tradeType, form.values]);

  return (
    <form onSubmit={form.onSubmit((values) => onSubmit(tradeLimit!, values))}>
      <Card
        sx={{ overflow: "visible" }}
        shadow={"xs"}
        radius={"md"}
        padding={"lg"}
        mt={"xl"}
        mb={"xl"}
      >
        <div ref={tokenSelectorPortal}></div>
        <Flex align={"center"} justify={"space-between"}>
          <Title order={2}>Trade tokens</Title>
          <Popover withArrow shadow={"xs"} arrowPosition={"side"}>
            <Popover.Target>
              <ActionIcon>
                <IconSettings />
              </ActionIcon>
            </Popover.Target>
            <Popover.Dropdown p={"sm"}>
              <Stack spacing={"xs"}>
                <Stack spacing={"0.25rem"}>
                  <NumberInput
                    label={"Allowed slippage"}
                    description={
                      "Control the amount of slippage incurred during the swap"
                    }
                    styles={{
                      input: {
                        display: "none",
                      },
                    }}
                  />
                  <Stack spacing={"xs"}>
                    <NumberInput
                      hideControls
                      rightSection={<Text>%</Text>}
                      precision={2}
                      max={100}
                      type="number"
                      min={0}
                      {...form.getInputProps("allowedSlippage")}
                    />
                    <Group spacing={"xs"} grow>
                      <Button
                        miw={"80px"}
                        onClick={() =>
                          form.setFieldValue(
                            "allowedSlippage",
                            defaultAllowedSlippage
                          )
                        }
                      >
                        Auto
                      </Button>
                      <Button
                        variant={"outline"}
                        onClick={() => form.setFieldValue("allowedSlippage", 5)}
                      >
                        5%
                      </Button>
                      <Button
                        variant={"outline"}
                        onClick={() =>
                          form.setFieldValue("allowedSlippage", 10)
                        }
                      >
                        10%
                      </Button>
                      <Button
                        variant={"outline"}
                        onClick={() =>
                          form.setFieldValue("allowedSlippage", 15)
                        }
                      >
                        15%
                      </Button>
                    </Group>
                  </Stack>
                </Stack>
              </Stack>
            </Popover.Dropdown>
          </Popover>
        </Flex>

        <Stack spacing={"md"} mt={"lg"}>
          <Stack
            spacing={"xs"}
            sx={{
              position: "relative",
            }}
          >
            <Title order={4}>You pay</Title>
            <Flex
              justify={"end"}
              pr={"0.15rem"}
              pb={"0.15rem"}
              sx={{
                position: "absolute",
                right: "0rem",
                top: "0.45rem",
              }}
            >
              <Group spacing={"0.45rem"} opacity={0.5}>
                <Skeleton visible={userBalanceA.loading}>
                  <Text color={"dimmed"} size={"xs"} weight={"bold"}>
                    {form.values.tokenIn &&
                    (userBalanceA.loading || userBalanceA.value) ? (
                      <>
                        Balance:{" "}
                        {formatBalanceDecimals(userBalanceA.value) ?? "-"}{" "}
                        {tokens[form.values.tokenIn!]?.ticker}
                      </>
                    ) : (
                      ""
                    )}
                  </Text>
                </Skeleton>
                {/* <Button
                  compact
                  size={"xs"}
                  color={"gray"}
                  sx={{ fontSize: "0.55rem", padding: "0.25rem" }}
                >
                  MAX
                </Button> */}
              </Group>
            </Flex>

            <TradeTokenInput
              form={form}
              tokenSelectorName={"tokenIn"}
              tokenInmountName={"tokenInAmount"}
              tokenSelectorPortal={tokenSelectorPortal.current!}
            />
          </Stack>

          <Card.Section>
            <Flex align={"center"} gap={"xs"}>
              <Divider w={"1.25rem"} />

              <ActionIcon
                color={"primary"}
                variant={"light"}
                size={"xl"}
                radius={"xl"}
                maw={"fit-content"}
                sx={{
                  transition: "transform .2s ease-in-out",
                  ":hover": {
                    transform: "rotate(180deg)",
                  },
                }}
                onClick={handleSwitchTokens}
              >
                <IconArrowDown />
              </ActionIcon>
              {spotPrice?.aToB && spotPrice.bToA ? (
                <>
                  <Divider
                    w={"100%"}
                    label={
                      spotPrice?.aToB && spotPrice.bToA
                        ? `1 ${
                            tradeType === "sell"
                              ? tokens[form.values.tokenIn!]?.ticker
                              : tokens[form.values.tokenOut!]?.ticker
                          } = ${
                            tradeType === "sell"
                              ? spotPrice?.bToA
                              : spotPrice?.aToB
                          } ${
                            tradeType === "sell"
                              ? tokens[form.values.tokenOut!]?.ticker
                              : tokens[form.values.tokenIn!]?.ticker
                          }`
                        : null
                    }
                    labelPosition={"right"}
                    styles={(theme) => ({
                      label: {
                        //   background: theme.colors.gray[1],
                      },
                    })}
                  />
                  <Divider w={"1.25rem"} />
                </>
              ) : (
                <Divider w={"100%"} />
              )}
            </Flex>
          </Card.Section>

          <Stack
            spacing={"xs"}
            sx={{
              position: "relative",
            }}
          >
            <Title order={4}>You get</Title>
            <Flex
              justify={"end"}
              pr={"0.15rem"}
              pb={"0.15rem"}
              sx={{
                position: "absolute",
                right: "0rem",
                top: "0.45rem",
              }}
            >
              <Group spacing={"0.45rem"} opacity={0.5}>
                <Skeleton visible={userBalanceB.loading}>
                  <Text color={"dimmed"} size={"xs"} weight={"bold"}>
                    {form.values.tokenOut &&
                    (userBalanceB.loading || userBalanceB.value) ? (
                      <>
                        Balance:{" "}
                        {formatBalanceDecimals(userBalanceB.value) ?? "0"}{" "}
                        {tokens[form.values.tokenOut!]?.ticker}
                      </>
                    ) : (
                      ""
                    )}
                  </Text>
                </Skeleton>
              </Group>
            </Flex>

            <TradeTokenInput
              form={form}
              tokenSelectorName={"tokenOut"}
              tokenInmountName={"tokenOutAmount"}
              tokenSelectorPortal={tokenSelectorPortal.current!}
            />
          </Stack>
        </Stack>
        <Stack mt={"lg"}>
          <Button size={"lg"} color={"violet"} type="submit">
            <Text transform={"uppercase"}>Swap</Text>
          </Button>
        </Stack>
        <Card.Section mt={"lg"}>
          <Box
            bg={colorScheme === "light" ? "gray.0" : "dark.7"}
            // uncomment when advanced section should be available
            p={"lg"}
          >
            <Stack>
              <Center onClick={toggleDetails} sx={{ cursor: "pointer" }}>
                <Anchor size={"sm"} color={"dimmed"}>
                  <Group spacing={"0.125rem"}>
                    Advanced information{" "}
                    {showDetails ? (
                      <IconChevronUp size={"1.125rem"} />
                    ) : (
                      <IconChevronDown size={"1.125rem"} />
                    )}
                  </Group>
                </Anchor>
              </Center>
              <Collapse in={showDetails}>
                <Stack spacing={"xs"}>
                  <Flex justify={"space-between"}>
                    <Text
                      color={"dimmed"}
                      size={"xs"}
                      transform={"uppercase"}
                      weight={"bold"}
                    >
                      Trade price
                    </Text>
                    <Text size={"xs"} weight={"bold"}>
                      {tradePrice &&
                      form.values.tokenIn &&
                      form.values.tokenOut &&
                      form.values.tokenInAmount &&
                      form.values.tokenOutAmount
                        ? `1 ${
                            tradeType === "sell"
                              ? tokens[form.values.tokenIn!]?.ticker
                              : tokens[form.values.tokenOut!]?.ticker
                          } = ${tradePrice} ${
                            tradeType === "sell"
                              ? tokens[form.values.tokenOut!]?.ticker
                              : tokens[form.values.tokenIn!]?.ticker
                          }`
                        : "-"}
                    </Text>
                  </Flex>

                  <Flex justify={"space-between"}>
                    <Text
                      color={"dimmed"}
                      size={"xs"}
                      transform={"uppercase"}
                      weight={"bold"}
                    >
                      Trade limit
                    </Text>
                    <Text size={"xs"} weight={"bold"}>
                      {tradeLimit &&
                      form.values.tokenIn &&
                      form.values.tokenOut &&
                      form.values.tokenInAmount &&
                      form.values.tokenOutAmount
                        ? `${tradeLimit} ${
                            tradeType === "sell"
                              ? tokens[form.values.tokenOut!]?.ticker
                              : tokens[form.values.tokenIn!]?.ticker
                          }`
                        : "-"}
                    </Text>
                  </Flex>
                </Stack>
              </Collapse>
            </Stack>
          </Box>
        </Card.Section>
      </Card>
    </form>
  );
};
