import { Container } from "@chakra-ui/react";

import Auth from "./Auth";
import Header from "./Header";

export default function DashboardLayout({ children }) {
  return (
    <Auth>
      <Header />
      <Container maxW={"container.xl"} py={16}>
        {children}
      </Container>
    </Auth>
  );
}
