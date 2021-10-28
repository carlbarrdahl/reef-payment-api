import {
  Table,
  Thead,
  Tbody,
  Tfoot,
  Tr,
  Th,
  Td,
  TableCaption,
  Button,
  Box,
  Heading,
  Input,
  FormControl,
  Link,
  SkeletonText,
} from "@chakra-ui/react";
import { CheckIcon, WarningIcon } from "@chakra-ui/icons";
import { timeAgo, truncate } from "../utils/format";

import { useSubscription, gql } from "@apollo/client";
import { useState } from "react";
import config from "../config";

function TransactionsTable({
  accountId,
  error,
  isLoading,
  transactions = [],
  onChangeAddress,
}) {
  const [address, setAddress] = useState();

  function handleChangeAddress(newAddress) {
    setAddress(newAddress);
    onChangeAddress(newAddress);
  }
  return (
    <Box pt={12}>
      <Heading size={"md"} mb={6} color={"gray.600"}>
        Transactions
      </Heading>
      <FormControl id="address" mb={4}>
        <Input
          value={address}
          placeholder="Filter by wallet address..."
          onChange={(e) => handleChangeAddress(e.target.value)}
        />
      </FormControl>
      <Table size="sm">
        <Thead>
          <Tr>
            <Th>Hash</Th>
            <Th>Age</Th>
            <Th>From</Th>
            <Th>To</Th>
            <Th>Amount</Th>
            <Th>Success</Th>
            {/* <Th isNumeric>Action</Th> */}
          </Tr>
        </Thead>
        <Tbody>
          {isLoading || error ? (
            <Tr>
              <Td colSpan={7}>
                {isLoading ? (
                  <SkeletonText noOfLines={1} />
                ) : (
                  <pre>{error}</pre>
                )}
              </Td>
            </Tr>
          ) : (
            transactions.map((tx) => (
              <Tr key={tx.hash}>
                <Td>
                  <Link
                    color="blue.500"
                    href={`${config.network.explorerURL}/transfer/${tx.hash}`}
                    target="_blank"
                  >
                    {truncate(tx.hash, 20)}
                  </Link>
                </Td>
                <Td>{timeAgo(tx.timestamp * 1000)}</Td>
                <Td onClick={() => handleChangeAddress(tx.source)}>
                  <Link color="blue.500">{truncate(tx.source)}</Link>
                </Td>
                <Td onClick={() => handleChangeAddress(tx.destination)}>
                  <Link color="blue.500">{truncate(tx.destination)}</Link>
                </Td>
                <Td>{tx.amount / 10 ** config.network.tokenDecimals}</Td>
                <Td textAlign="center">
                  {tx.success ? (
                    <CheckIcon color={"green.500"} />
                  ) : (
                    <WarningIcon color={"red.500"} />
                  )}
                </Td>
                {/* <Td isNumeric>
                  <Button onClick={() => alert("not implemented yet")}>
                    Refund
                  </Button>
                </Td> */}
              </Tr>
            ))
          )}
        </Tbody>
      </Table>
    </Box>
  );
}

const merchantWallet = "5GCcgnwdLhwq3HmjsRaotPY5PuF8ivVcRTtP75JJPk7uzTMJ";
export default function ConnectedTransactionTable() {
  const [accountId, setAccountId] = useState(merchantWallet);
  const { data, loading, error } = useSubscription(
    gql`
      subscription transfer($accountId: String!) {
        transfer(
          order_by: { block_number: desc }
          where: {
            _or: [
              { source: { _eq: $accountId } }
              { destination: { _eq: $accountId } }
            ]
          }
        ) {
          block_number
          extrinsic_index
          section
          method
          hash
          source
          destination
          amount
          denom
          fee_amount
          success
          error_message
          timestamp
        }
      }
    `,
    { variables: { accountId } }
  );

  console.log("data", data, error);

  function onChangeAddress(address) {
    setAccountId(address);
  }

  return (
    <TransactionsTable
      isLoading={loading}
      error={error?.message}
      transactions={data?.transfer}
      onChangeAddress={onChangeAddress}
    />
  );
}
