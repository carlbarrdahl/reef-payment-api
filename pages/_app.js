import { ChakraProvider } from "@chakra-ui/react";
import { ApolloProvider } from "@apollo/client";
import { QueryClient, QueryClientProvider } from "react-query";
import { FirebaseAppProvider } from "reactfire";

import { createApolloClient } from "../lib/apollo";
import config from "../config";

const apolloClient = createApolloClient();

const queryClient = new QueryClient({
  defaultOptions: { refetchOnWindowFocus: false },
});

function MyApp({ Component, pageProps }) {
  return (
    <ApolloProvider client={apolloClient}>
      <QueryClientProvider client={queryClient}>
        <ChakraProvider>
          <FirebaseAppProvider firebaseConfig={config.firebase}>
            <Component {...pageProps} />
          </FirebaseAppProvider>
        </ChakraProvider>
      </QueryClientProvider>
    </ApolloProvider>
  );
}

export default MyApp;
