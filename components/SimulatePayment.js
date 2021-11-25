import {
  Button,
  Box,
  Heading,
  Input,
  FormControl,
  FormLabel,
  Skeleton,
  Spinner,
} from "@chakra-ui/react";

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
    try {
      localStorage.setItem("merchant-shop", JSON.stringify(val));
    } catch (error) {}
  },
};

function PaymentForm({ address, apiKey, isLoading, onSubmit }) {
  const { register, handleSubmit } = useForm({
    defaultValues: {
      ...store.get(),
      apiKey,
    },
  });
  return (
    <Box as="form" onSubmit={handleSubmit(onSubmit)}>
      <FormControl>
        <FormLabel mb={1}>Amount</FormLabel>
        <Input required {...register("amount")} size="sm" mb={4} />
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
          placeholder="https://"
          {...register("redirectURL")}
          mb={4}
        />
      </FormControl>
      <Button type="submit" isFullWidth disabled={isLoading}>
        {isLoading ? <Spinner /> : "Checkout with Reef"}
      </Button>
    </Box>
  );
}
export default function SimulatePayment(props) {
  const walletAddress = useWalletAddress();
  const apiKey = useAPIKey();
  const checkout = useCheckout();

  function sendAndSave(values) {
    // Store in localStorage so we don't have to enter them every time
    store.set(values);
    checkout
      .mutateAsync({ ...values })
      .then(({ checkoutURL }) => (window.location = checkoutURL))
      .catch(console.log);
  }

  const isLoading = walletAddress.isLoading || apiKey.isLoading;
  const error = walletAddress.error || apiKey.error || checkout.error;

  return (
    <Box mb={16}>
      <Heading size="md" mb={4}>
        Simulate payment
      </Heading>
      {isLoading ? (
        <Skeleton height="420px" />
      ) : error ? (
        <ErrorMessage error={error} retry={checkout.refetch} />
      ) : (
        <PaymentForm
          address={walletAddress.wallet}
          apiKey={apiKey.apiKey}
          isLoading={checkout.isLoading}
          onSubmit={sendAndSave}
        />
      )}
    </Box>
  );
}
