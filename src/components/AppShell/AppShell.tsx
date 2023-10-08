import React, { PropsWithChildren, ReactNode } from "react";
import { Container, Flex } from "@mantine/core";

const appShellStyles = (theme) => ({
  backgroundColor:
    theme.colorScheme === "dark" ? theme.colors.dark[9] : theme.colors.gray[0],
});

interface AppShellProps extends PropsWithChildren {
  header: ReactNode;
  footer: ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({
  children,
  header,
  footer,
}) => {
  return (
    <Flex
      direction={"column"}
      justify={"space-between"}
      mih={"100%"}
      sx={appShellStyles}
    >
      {header}
      <Container size={"md"} mb={"xl"} mt={"xl"}>
        {children}
      </Container>
      {footer}
    </Flex>
  );
};
