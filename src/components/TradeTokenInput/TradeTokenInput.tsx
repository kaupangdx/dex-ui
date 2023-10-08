import React, {
  MouseEvent,
  PropsWithChildren,
  ReactNode,
  useCallback,
  useEffect,
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
  Container,
  Divider,
  Flex,
  Group,
  Header,
  Image,
  Input,
  AppShell as MantineAppShell,
  NativeSelect,
  NavLink,
  NumberInput,
  Paper,
  Portal,
  PortalProps,
  Select,
  Space,
  Stack,
  Text,
  TextInput,
  Title,
  Tooltip,
  createStyles,
} from "@mantine/core";

import kaupangIcon from "./kaupang.png";
import {
  IconArrowDown,
  IconArrowsDownUp,
  IconQuestionMark,
} from "@tabler/icons-react";
import { useFormatBalance } from "../../hooks/balances/useFormatBalance";
import { UseFormReturnType } from "@mantine/form";
import { TokenSelector } from "../TokenSelector/TokenSelector";
import { Token, tokens } from "../../tokens";

export interface TradeTokenInputProps<FormFields> {
  tokenSelectorPlaceholder?: string;
  tokenInputPlaceholder?: string;
  form: UseFormReturnType<FormFields>;
  tokenSelectorName: keyof FormFields;
  tokenInmountName: keyof FormFields;
  tokenSelectorPortal: PortalProps["target"];
}

export const TradeTokenInput = <FormFields,>({
  tokenSelectorPlaceholder = "Select token",
  tokenInputPlaceholder = "0",
  form,
  tokenSelectorName,
  tokenInmountName,
  tokenSelectorPortal,
}: TradeTokenInputProps<FormFields>): ReactNode => {
  const [tokenSelectorVisible, setTokenSelectorVisible] = useState(false);
  const formatInPlace = useFormatBalance({
    withDecimals: false,
  });

  const handleBlur = useCallback(() => {
    form.getInputProps(tokenInmountName).onBlur();
    const value = form.values[tokenInmountName];
    const formattedValue = (value && formatInPlace(value as any)) ?? value;

    form.setFieldValue(tokenInmountName, formattedValue as any);
  }, [formatInPlace, form, tokenInmountName]);

  const handleChange = useCallback((event) => {
    form.getInputProps(tokenInmountName).onChange(event);
    form.setFieldValue(
      tokenInmountName,
      event.currentTarget.value.replace(",", ".")
    );
  }, []);

  const handleOpenTokenSelector = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();
      setTokenSelectorVisible(true);
    },
    []
  );

  const handleCloseTokenSelector = useCallback(() => {
    setTimeout(() => {
      setTokenSelectorVisible(false);
    }, 100);
  }, []);

  const handleTokenSelected = useCallback((tokenId: string) => {
    form.setFieldValue(tokenSelectorName, tokenId as any);
  }, []);

  const token: Token | undefined =
    tokens[form.values[tokenSelectorName] as string];

  return (
    <>
      {tokenSelectorPortal && (
        <Portal target={tokenSelectorPortal}>
          {tokenSelectorVisible && (
            <TokenSelector
              onClose={handleCloseTokenSelector}
              onSelect={handleTokenSelected}
            />
          )}
        </Portal>
      )}
      <Paper withBorder p={"xs"} pt={0} pb={0} radius={"md"}>
        <Flex gap={"xs"} align={"center"}>
          <Flex
            gap={"sm"}
            align={"center"}
            miw={"160px"}
            onClick={handleOpenTokenSelector}
            sx={{
              cursor: "pointer",
            }}
            pl={"0.125rem"}
          >
            <Avatar radius={"xl"} maw={"2rem"} size={"md"} mt={"0.25rem"}>
              {token?.logo ? (
                <Image radius={"xl"} src={token.logo} />
              ) : (
                <IconQuestionMark size={"1.125rem"} />
              )}
            </Avatar>
            <Stack spacing={0}>
              <Select
                styles={{
                  input: {
                    paddingRight: 0,
                    paddingLeft: 0,
                    width: "fit-content",
                    lineHeight: "1rem",
                    height: "1rem",
                  },
                  rightSection: {
                    display: "none",
                  },
                  dropdown: {
                    display: "none",
                  },
                }}
                variant={"unstyled"}
                data={Object.values(tokens).map((token) => token.ticker)}
                size={"md"}
                dropdownComponent={() => {
                  return <></>;
                }}
                placeholder={tokenSelectorPlaceholder}
                {...form.getInputProps(tokenSelectorName)}
                value={token?.ticker}
              />
              <Text color={"dimmed"} size={"xs"}>
                {token?.name ?? ""}
              </Text>
            </Stack>
          </Flex>

          <Stack spacing={0} align={"end"} pt={"md"} pb={"md"} w={"100%"}>
            <TextInput
              placeholder={tokenInputPlaceholder}
              size={"lg"}
              min={0}
              w={"100%"}
              styles={(theme) => ({
                input: {
                  textAlign: "right",
                  height: "1rem",
                },
              })}
              variant={"unstyled"}
              maw={"100%"}
              type={"text"}
              {...form.getInputProps(tokenInmountName)}
              onBlur={handleBlur}
              onChange={handleChange}
            />
            <Tooltip
              label="Support for USD conversion comming soon"
              openDelay={300}
            >
              <Text color={"dimmed"}>- $</Text>
            </Tooltip>
          </Stack>
        </Flex>
      </Paper>
    </>
  );
};
