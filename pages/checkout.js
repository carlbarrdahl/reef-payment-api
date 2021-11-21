import {
  Alert,
  AlertTitle,
  AlertIcon,
  AlertDescription,
  Box,
  Flex,
  Text,
  Link,
  Button,
  Input,
  Spinner,
} from "@chakra-ui/react";
import { request } from "../lib/request";
import { useQuery } from "react-query";
import { useRouter } from "next/router";

import config from "../config";
import { useWallet } from "../hooks/wallet";
import { useWatchPayment } from "../hooks/api";
import { useEffect } from "react";

export default function CheckoutPage() {
  const router = useRouter();
  const { paymentId, amount, address, apiKey, redirectURL } = router.query;
  const wallet = useWallet();

  const { data, error, isLoading } = useWatchPayment({ apiKey, paymentId });

  console.log("wallet", wallet);

  useEffect(() => {
    if (data?.paidAmount) {
      console.log("Paid!");
      setTimeout(() => {
        router.replace(redirectURL);
      }, 3000);
    }
  }, [data]);
  return (
    <Flex
      alignItems="center"
      justifyContent="center"
      minHeight="100vh"
      bg="gray.200"
      py={8}
      flexDirection="column"
    >
      <Box w={380}>
        <Box bg="white" boxShadow="lg" p={8}>
          <Alert
            colorScheme="white"
            variant="subtle"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            textAlign="center"
            // height="200px"
            // mb={8}
          >
            {data?.paidAmount ? (
              <>
                <AlertIcon boxSize="40px" mr={0} />
                <AlertTitle mt={4} mb={1} fontSize="lg">
                  Payment received!
                </AlertTitle>
                <AlertDescription maxWidth="sm" mb={4}>
                  Thanks for shopping with REEF
                </AlertDescription>
                <Link
                  color="blue.500"
                  href={`https://testnet.reefscan.com/block/${data?.status?.finalized}`}
                  target="_blank"
                >
                  View block in explorer
                </Link>
              </>
            ) : (
              <>
                <Spinner size="xl" />
                <AlertTitle mt={4} mb={1} fontSize="lg">
                  Waiting for payment
                </AlertTitle>
                <Text fontSize="3xl" textAlign="center" py={8}>
                  {amount / 10 ** config.network.tokenDecimals}{" "}
                  {config.network.tokenSymbol}
                </Text>
                <Input value={address} variant="filled" readOnly mb={8} />
                <Button
                  colorScheme="purple"
                  onClick={() => wallet.transfer(address, amount)}
                  isFullWidth
                  disabled={isLoading || !wallet.wallet}
                >
                  {isLoading ? <Spinner /> : "Pay with Reef"}
                </Button>
              </>
            )}
          </Alert>
        </Box>
      </Box>
    </Flex>
  );
}
