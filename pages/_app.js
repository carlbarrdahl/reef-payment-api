import { ChakraProvider } from "@chakra-ui/react";
import { ApolloProvider } from "@apollo/client";
import { QueryClient, QueryClientProvider } from "react-query";
import { FirebaseAppProvider } from "reactfire";

import { createApolloClient } from "../lib/apollo";
import config from "../config";
import Web3Provider from "../hooks/wallet";

const apolloClient = createApolloClient();

const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false } },
});

function MyApp({ Component, pageProps }) {
  return (
    <ApolloProvider client={apolloClient}>
      <QueryClientProvider client={queryClient}>
        <ChakraProvider>
          <FirebaseAppProvider firebaseConfig={config.firebase}>
            <Web3Provider>
              <Component {...pageProps} />
            </Web3Provider>
          </FirebaseAppProvider>
        </ChakraProvider>
      </QueryClientProvider>
    </ApolloProvider>
  );
}

export default MyApp;
