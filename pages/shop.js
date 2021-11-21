import {
  Box,
  Image,
  Flex,
  Button,
  Input,
  InputGroup,
  InputRightAddon,
  FormControl,
  FormLabel,
  Spinner,
} from "@chakra-ui/react";
import { request } from "../lib/request";
import { useMutation } from "react-query";
import { useRouter } from "next/router";
import { useForm } from "react-hook-form";
import config from "../config";
import { useWallet } from "../hooks/wallet";

function usePayment() {
  return useMutation(({ apiKey, amount, address, redirectURL }) => {
    return request(`/api/checkout`, {
      method: "POST",
      body: JSON.stringify({
        paymentId: Math.random().toString(16).substr(2),
        address,
        amount: (
          Number(amount) *
          10 ** config.network.tokenDecimals
        ).toString(),
        redirectURL,
        timestamp: Date.now(),
      }),
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + apiKey,
      },
    });
  });
}

const store = {
  get: () => {
    try {
      return JSON.parse(localStorage.getItem("merchant-shop"));
    } catch (error) {}
    return {};
  },
  set: (val) => {
    localStorage.setItem("merchant-shop", JSON.stringify(val));
  },
};

export default function MerchantDemo() {
  const router = useRouter();
  const { register, handleSubmit, ...rest } = useForm({
    defaultValues: store.get(),
  });
  const wallet = useWallet();

  console.log("wallet", wallet);

  const { data, error, isLoading, mutateAsync: createPayment } = usePayment();

  console.log("ERORR", error);
  function sendAndSave(values) {
    // Store in localStorage so we don't have to enter them every time
    try {
      store.set(values);
    } catch (error) {}
    createPayment({ ...values, address: wallet.wallet._substrateAddress })
      .then(({ checkoutURL }) => {
        console.log("Checkout URL", checkoutURL);
        router.replace(checkoutURL);
      })
      .catch(console.log);
  }

  console.log("MerchantDemo", data, error, isLoading, rest);

  return (
    <Flex
      alignItems="center"
      justifyContent="center"
      minHeight="100vh"
      bg="gray.200"
      py={8}
      flexDirection="column"
    >
      <Box maxW={380} as="form" onSubmit={handleSubmit(sendAndSave)}>
        <Box bg="white" boxShadow="lg">
          <Image src="https://images.unsplash.com/photo-1620799139507-2a76f79a2f4d?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=1372&q=80" />
          <Box p={8} mb={8}>
            <FormControl>
              <FormLabel fontSize="sm" mb={1}>
                Amount
              </FormLabel>
              <InputGroup size="sm">
                <Input
                  required
                  step={"any"}
                  type="number"
                  {...register("amount")}
                  placeholder="Enter amount to pay..."
                  disabled={isLoading}
                  mb={4}
                />
                <InputRightAddon>REEF</InputRightAddon>
              </InputGroup>
            </FormControl>
            <Button
              type="submit"
              isFullWidth
              disabled={isLoading || !wallet.wallet}
            >
              {isLoading || !wallet.wallet ? <Spinner /> : "Pay with Reef"}
            </Button>
          </Box>
        </Box>
        {isLoading || data?.address ? null : (
          <Box bg="white" boxShadow="lg" p={8}>
            <FormControl>
              <FormLabel mb={1}>API Key</FormLabel>
              <Input
                autoFocus
                required
                {...register("apiKey")}
                size="sm"
                mb={4}
              />
            </FormControl>

            <FormControl>
              <FormLabel mb={1}>
                Redirect URL when payment is received
              </FormLabel>
              <Input
                required
                size="sm"
                {...register("redirectURL")}
                placeholder="https://"
                mb={4}
              />
            </FormControl>
          </Box>
        )}
      </Box>
    </Flex>
  );
}
