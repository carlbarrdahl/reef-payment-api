import React from "react";

import { Divider } from "@chakra-ui/react";

import Layout from "../components/Layout";

import TransactionsTable from "../components/TransactionsTable";
import MerchantSettings from "../components/MerchantSettings";

const Dashboard = ({ favoriteColor }) => {
  return (
    <Layout>
      <MerchantSettings />
      <Divider />
      <TransactionsTable />
    </Layout>
  );
};

export default Dashboard;
