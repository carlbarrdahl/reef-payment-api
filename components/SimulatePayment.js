import {
  Button,
  Box,
  Heading,
  Input,
  FormControl,
  FormLabel,
  Spinner,
} from "@chakra-ui/react";
import { useRouter } from "next/router";

import { useAPIKey, useCheckout, useWalletAddress } from "../hooks/api";

import ErrorMessage from "./ErrorMessage";
import { useForm } from "react-hook-form";

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

export default function SimulatePayment(props) {
  const router = useRouter();
  const { register, handleSubmit, ...rest } = useForm({
    defaultValues: {
      ...store.get(),
      paymentId: Math.random().toString(16).substr(2),
    },
  });

  const walletAddress = useWalletAddress();

  const apiKey = useAPIKey();

  const checkout = useCheckout();
  console.log({ walletAddress, apiKey, checkout });
  function sendAndSave(values) {
    console.log("VALUES", values);
    // Store in localStorage so we don't have to enter them every time
    try {
      store.set(values);
    } catch (error) {}
    checkout
      .mutateAsync({ ...values })
      .then(({ checkoutURL }) => {
        console.log("Checkout URL", checkoutURL);
        router.replace(checkoutURL);
      })
      .catch(console.log);
  }

  const isLoading =
    walletAddress.isLoading || apiKey.isLoading || checkout.isLoading;

  return (
    <Box mb={16}>
      <Heading size="md" mb={4}>
        Simulate payment
      </Heading>
      <Box maxW={380} as="form" onSubmit={handleSubmit(sendAndSave)}>
        <FormControl>
          <FormLabel mb={1}>Payment ID</FormLabel>
          <Input required {...register("paymentId")} size="sm" mb={4} />
        </FormControl>
        <FormControl>
          <FormLabel mb={1}>Amount</FormLabel>
          <Input required {...register("amount")} size="sm" mb={4} />
        </FormControl>
        <FormControl>
          <FormLabel mb={1}>Wallet address</FormLabel>
          <Input
            required
            value={walletAddress.wallet}
            readOnly
            {...register("address")}
            size="sm"
            mb={4}
          />
        </FormControl>
        <FormControl>
          <FormLabel mb={1}>API Key</FormLabel>
          <Input required {...register("apiKey")} size="sm" mb={4} />
        </FormControl>

        <FormControl>
          <FormLabel mb={1}>Redirect URL when payment is received</FormLabel>
          <Input
            required
            size="sm"
            {...register("redirectURL")}
            placeholder="https://"
            mb={4}
          />
        </FormControl>
        <Button type="submit" isFullWidth disabled={isLoading}>
          {isLoading ? <Spinner /> : "Checkout with Reef"}
        </Button>
      </Box>
    </Box>
  );
}
