import { Alert, AlertIcon, Button, Flex } from "@chakra-ui/react";

export default function ErrorMessage({
  error = "There was an error processing your request",
  retry,
}) {
  return (
    <Alert status="error">
      <AlertIcon />
      <Flex alignItems="center" justifyContent="space-between" flex="1">
        {error}
        {retry ? (
          <Button size="sm" onClick={retry} colorScheme="red">
            Retry
          </Button>
        ) : null}
      </Flex>
    </Alert>
  );
}
