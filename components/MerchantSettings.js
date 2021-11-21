import {
  Button,
  Box,
  Flex,
  Heading,
  Text,
  Input,
  Link,
  IconButton,
  InputGroup,
  InputRightElement,
  FormControl,
  FormLabel,
  FormHelperText,
  Spinner,
  Skeleton,
} from "@chakra-ui/react";
import { ViewIcon, ViewOffIcon } from "@chakra-ui/icons";
import { useEffect, useState } from "react";

import { useAPIKey, useWalletAddress } from "../hooks/api";

import ErrorMessage from "./ErrorMessage";
import { useWallet } from "../hooks/wallet";

function ConfigAPIKey() {
  const [showKey, toggleShowKey] = useState(false);

  const handleShowAPIKey = () => toggleShowKey(!showKey);
  const { apiKey, create, error, refetch, isLoading } = useAPIKey();

  return (
    <FormControl id="api-key" mb={8}>
      <FormLabel>API key</FormLabel>
      <FormHelperText mb={3}>
        Key to be used in Authorization header in call Payment API
      </FormHelperText>
      {error ? (
        <ErrorMessage error={error} retry={refetch} />
      ) : (
        <Flex>
          <InputGroup mr={4}>
            <Input
              value={apiKey || ""}
              readOnly
              type={showKey ? "text" : "password"}
            />
            <InputRightElement>
              <IconButton
                disabled={isLoading}
                onClick={handleShowAPIKey}
                icon={
                  isLoading ? (
                    <Spinner />
                  ) : showKey ? (
                    <ViewOffIcon />
                  ) : (
                    <ViewIcon />
                  )
                }
              />
            </InputRightElement>
          </InputGroup>
          <Button type="submit" onClick={create} disabled={isLoading}>
            Create new API key
          </Button>
        </Flex>
      )}
    </FormControl>
  );
}

function ConfigWalletAddress() {
  const [address, setAddress] = useState("");
  const { wallet } = useWallet();

  const {
    wallet: walletAddress,
    save,
    error,
    refetch,
    isLoading,
  } = useWalletAddress();

  console.log("wallet", wallet);
  // Update input field if server returns data
  useEffect(() => {
    setAddress(walletAddress);
  }, [walletAddress]);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save(address);
      }}
    >
      <FormControl id="address" isRequired mb={8}>
        <FormLabel>Wallet address</FormLabel>
        <FormHelperText mb={3}>
          Wallet to transfer funds to when balace is settled in payment
          <Text mt={2}>
            Currently signed in with:{" "}
            <Link
              color="blue.500"
              onClick={() => setAddress(wallet?._substrateAddress)}
            >
              {wallet?._substrateAddress}
            </Link>
          </Text>
        </FormHelperText>
        {error ? (
          <ErrorMessage error={error} retry={refetch} />
        ) : (
          <Flex>
            <Skeleton flex="1" isLoaded={!isLoading} mr={4}>
              <Input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Enter wallet address to transfer funds to..."
              />
            </Skeleton>
            <Button type="submit" disabled={isLoading}>
              Save address
            </Button>
          </Flex>
        )}
      </FormControl>
    </form>
  );
}

export default function MerchantSettings(props) {
  return (
    <Box mb={16}>
      <Heading size="md" mb={4}>
        Settings
      </Heading>

      <ConfigAPIKey />
      <ConfigWalletAddress />
    </Box>
  );
}
