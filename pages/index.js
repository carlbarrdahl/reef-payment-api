import React from "react";

import { Divider, Flex, Box, SimpleGrid } from "@chakra-ui/react";

import Layout from "../components/Layout";

import TransactionsTable from "../components/TransactionsTable";
import MerchantSettings from "../components/MerchantSettings";
import SimulatePayment from "../components/SimulatePayment";

const Dashboard = ({ favoriteColor }) => {
  return (
    <Layout>
      <SimpleGrid spacingX={8} templateColumns={["1fr", "1fr", "2fr 1fr"]}>
        <Box>
          <MerchantSettings />
        </Box>
        <Box>
          <SimulatePayment />
        </Box>
      </SimpleGrid>
      <Divider />
      <Divider />
      <TransactionsTable />
    </Layout>
  );
};

export default Dashboard;
