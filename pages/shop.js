import {
  Box,
  Divider,
  AspectRatio,
  Image,
  Flex,
  Button,
  Input,
  FormControl,
  FormLabel,
  Text,
  Heading,
  SimpleGrid,
  Spinner,
} from "@chakra-ui/react";
import { useForm } from "react-hook-form";
import { store } from "../utils/localStorage";
import { useCheckout } from "../hooks/api";
import { useState } from "react";
import config from "../config";

function useCart() {
  const [quantities, setQuantity] = useState({});

  const inc = (pid) =>
    setQuantity({ ...quantities, [pid]: (quantities[pid] || 0) + 1 });
  const dec = (pid) =>
    setQuantity({ ...quantities, [pid]: (quantities[pid] || 0) - 1 });

  return { inc, dec, quantities };
}

function getCart(products, quantities) {
  return products.reduce(
    (cart, p) => {
      const quantity = quantities[p.id] || 0;
      return {
        lineItems:
          // Add the item if its in the cart
          quantity > 0
            ? cart.lineItems.concat({ quantity, price: p.price })
            : cart.lineItems,
        totalAmount: cart.totalAmount + p.amount * quantity,
      };
    },
    { lineItems: [], totalAmount: 0 }
  );
}

function ProductCard({ product, quantity = 0, onRemoveFromCart, onAddToCart }) {
  return (
    <Box bg="white" boxShadow="lg" mb={4}>
      <AspectRatio maxW="400px" ratio={4 / 3}>
        <Image src={product.image} objectFit="cover" />
      </AspectRatio>
      <Box p={2}>
        <Flex justifyContent="space-between" mb={4}>
          <Heading fontSize="md">{product.name}</Heading>
          <Text>
            {product.amount / 10 ** config.network.tokenDecimals} REEF
          </Text>
        </Flex>
        <Flex justifyContent="space-between">
          <Flex alignItems="center">
            <Text>{quantity}</Text>
          </Flex>
          <Flex>
            <Button
              size="sm"
              onClick={onRemoveFromCart}
              mr={2}
              disabled={!quantity}
            >
              −
            </Button>
            <Button
              onClick={onAddToCart}
              colorScheme="purple"
              variant="outline"
              size="sm"
            >
              Add to Cart
            </Button>
          </Flex>
        </Flex>
      </Box>
    </Box>
  );
}

const products = [
  {
    id: "tshirt",
    name: "T-shirt",
    image:
      "https://images.unsplash.com/photo-1620799139507-2a76f79a2f4d?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=1372&q=80",
    description: "Normal looking tshirt",
    amount: 4 * 10 ** config.network.tokenDecimals,
  },
  {
    id: "jeans",
    name: "Jeans",
    description: "Blue jeans",
    image:
      "https://images.unsplash.com/photo-1565084888279-aca607ecce0c?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80",
    amount: 5.5 * 10 ** config.network.tokenDecimals,
  },
];

export default function MerchantDemo() {
  const { register, handleSubmit } = useForm({
    defaultValues: {
      ...store.get(),
    },
  });

  const checkout = useCheckout();

  const cart = useCart();
  const total = getCart(products, cart.quantities);

  function sendAndSave({ apiKey, redirectURL, ...rest }) {
    console.log({ apiKey, redirectURL, amount: total.totalAmount });
    // Store in localStorage so we don't have to enter them every time
    store.set({ apiKey, redirectURL });
    checkout
      .mutateAsync({
        apiKey,
        redirectURL,
        amount: total.totalAmount.toString(),
      })
      .then(({ checkoutURL }) => (window.location = checkoutURL))
      .catch(console.log);
  }

  const isLoading = checkout.isLoading;
  const error = checkout.error;

  return (
    <Flex
      alignItems="center"
      justifyContent="center"
      minHeight="100vh"
      bg="gray.200"
      py={8}
      flexDirection="column"
    >
      <Box as="form" onSubmit={handleSubmit(sendAndSave)} p={4}>
        <SimpleGrid
          columns={[1, 2]}
          columnGap={8}
          w={["100%", "100%", "2xl"]}
          mb={4}
        >
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              quantity={cart.quantities[product.id]}
              onRemoveFromCart={() => cart.dec(product.id)}
              onAddToCart={() => cart.inc(product.id)}
            />
          ))}
        </SimpleGrid>
        <Flex justifyContent="space-between" mb={8}>
          <Box pr={2} minW="100px">
            <Text
              fontSize="xs"
              textTransform="uppercase"
              color="gray.500"
              textAlign="center"
            >
              Total
            </Text>
            <Text fontSize="md" textAlign="center">
              {total.totalAmount / 10 ** config.network.tokenDecimals} REEF
            </Text>
          </Box>
          <Button
            disabled={checkout.isLoading || !total.totalAmount}
            type="submit"
            colorScheme="purple"
          >
            {checkout.isLoading ? <Spinner /> : "Pay with Reef"}
          </Button>
        </Flex>
        {isLoading ? null : (
          <Box bg="gray.100" boxShadow="sm" p={8}>
            <Text mb={4} color="gray.600">
              For testing different merchant settings
            </Text>
            <FormControl>
              <FormLabel mb={1}>API Key</FormLabel>
              <Input autoFocus {...register("apiKey")} size="sm" mb={4} />
            </FormControl>

            <FormControl>
              <FormLabel mb={1}>
                Redirect URL when payment is received
              </FormLabel>
              <Input
                required
                size="sm"
                {...register("redirectURL")}
                placeholder="https://"
                mb={4}
              />
            </FormControl>
          </Box>
        )}
      </Box>
    </Flex>
  );
}
