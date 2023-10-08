import { Center, Loader, LoadingOverlay, Stack, Text } from "@mantine/core";
import React, { useEffect, useState } from "react";

export interface ChainLoadingOverlayProps {
  loading: boolean;
}

export const ChainLoadingOverlay: React.FC<ChainLoadingOverlayProps> = ({
  loading,
}) => {
  const [timer, setTimer] = useState(0);
  useEffect(() => {
    const intervalId = setInterval(() => {
      setTimer((timer) => timer + 1);
    }, 1000);

    return () => clearInterval(intervalId);
  }, []);
  return (
    <LoadingOverlay
      miw={"100%"}
      h={"100%"}
      visible={loading}
      transitionDuration={100}
      overlayBlur={2}
      sx={{
        position: "fixed",
      }}
      loader={
        <Center>
          <Stack align={"center"}>
            <Loader variant={"bars"} size={"xl"} />
            <Stack align={"center"} spacing={"0.25rem"}>
              <Text size={"lg"}>Preparing the sandbox</Text>
              <Text color={"dimmed"} align={"center"}>
                We're creating trading pools <br /> in the background, please
                wait :)
              </Text>
              <Text color={"dimmed"} size={"xs"}>
                Time elapsed: {timer}s
              </Text>
            </Stack>
          </Stack>
        </Center>
      }
    />
  );
};
