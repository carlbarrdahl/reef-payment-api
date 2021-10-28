import { Button, Flex, Avatar } from "@chakra-ui/react";

import { useFirebaseApp } from "reactfire";
import { getAuth } from "firebase/auth";

import { signOut } from "./Auth";

export default function Header({ children }) {
  const firebaseApp = useFirebaseApp();
  const auth = getAuth(firebaseApp);
  console.log("auth", auth.currentUser);
  return (
    <Flex
      alignItems="center"
      justifyContent="flex-end"
      p={4}
      color="gray.100"
      bg="gray.900"
    >
      <Avatar size="sm" mr={4} name={auth.currentUser?.displayName} />
      <Button
        variant="outline"
        onClick={() => signOut(auth)}
        sx={{
          _hover: {
            bg: "gray.100",
            color: "gray.800",
          },
        }}
      >
        Sign out
      </Button>
    </Flex>
  );
}
