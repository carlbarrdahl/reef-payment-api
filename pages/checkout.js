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
import { useRouter } from "next/router";

import config from "../config";
import { useWallet } from "../hooks/wallet";
import { useWatchPayment } from "../hooks/api";
import { useEffect, useState } from "react";

const from5Minutes = (start) => {
  const end = Date.now() - 5 * 60 * 1000;
  return (start - end) / 1000;
};

const formatCountdown = (seconds) => {
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${Math.floor(seconds - minutes * 60)
    .toString()
    .padStart(2, "0")}`;
};

function Countdown({ timestamp, onEnd }) {
  const [timer, setTimer] = useState(from5Minutes(timestamp));
  useEffect(() => {
    const _interval = setInterval(() => {
      const time = from5Minutes(timestamp);
      if (time < 0) {
        onEnd();
        clearInterval(_interval);
      }
      setTimer(time);
    }, 100);

    return () => clearInterval(_interval);
  }, [timestamp]);

  return <Text fontSize="4xl">{formatCountdown(timer)}</Text>;
}

export default function CheckoutPage() {
  const router = useRouter();
  const {
    paymentId,
    amount = 0,
    address,
    apiKey,
    timestamp,
    redirectURL,
  } = router.query;
  const wallet = useWallet();
  const [isTimeUp, setTimesUp] = useState(false);

  console.log(wallet.transaction);
  const { data, error, isLoading } = useWatchPayment({ apiKey, paymentId });

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
          >
            {isTimeUp ? (
              <>
                <AlertIcon boxSize="40px" mr={0} />
                <AlertTitle mt={4} mb={1} fontSize="lg">
                  Transaction has timed out
                </AlertTitle>
                <AlertDescription maxWidth="sm" mb={4}>
                  Please try again
                </AlertDescription>
                <Button
                  variant="link"
                  color="blue.500"
                  onClick={() => window.history.back()}
                  target="_blank"
                >
                  Back to Checkout
                </Button>
              </>
            ) : wallet.transaction === "finalized" || data?.paidAmount ? (
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
                <Countdown
                  timestamp={timestamp}
                  onEnd={() => setTimesUp(true)}
                />
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
                  disabled={wallet.transaction || !wallet.wallet}
                >
                  {wallet.transaction ? <Spinner /> : "Pay with Reef"}
                </Button>
              </>
            )}
          </Alert>
        </Box>
      </Box>
    </Flex>
  );
}
