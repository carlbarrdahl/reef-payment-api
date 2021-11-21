const admin = require("firebase-admin");
const request = require("supertest");

jest.mock("@polkadot/api");
jest.spyOn(admin, "auth").mockImplementation(() => {
  return {
    verifyIdToken: (...args) => {
      return { uid: "test-user" };
    },
  };
});
jest.spyOn(admin, "database").mockImplementation(() => {
  return {
    ref: (...args) => ({
      once: jest.fn().mockResolvedValue({
        val: () => ({}),
      }),
    }),
  };
});

const keyController = require("../routes/key");
const walletController = require("../routes/wallet");
const checkoutController = require("../routes/checkout");

const express = require("express");
const app = express();
app.use(express.json());

const mockData = {
  key: "test-key",
  wallet: "test-wallet",
};

const setMock = jest.fn();
const ctx = {
  createReefApi: () => {
    return {
      query: {
        system: {
          account: (address, callback) => {},
        },
      },
      tx: {
        balances: {
          transfer: (address, amount) => ({
            paymentInfo: (wallet) => ({}),
          }),
        },
      },
    };
  },
  db: {
    ref: jest.fn().mockImplementation((ref) => ({
      once: jest.fn().mockResolvedValue({
        val: () => {
          const [, , , type] = ref.split("/");
          return mockData[type];
        },
      }),
      set: setMock,
    })),
  },
};
describe("Reef Payment API", () => {
  beforeEach(() => {
    setMock.mockRestore();
  });
  const headers = {
    Authorization: "Bearer test-token",
  };
  test("GET /key", async () => {
    const res = await request(keyController(app, ctx)).get("/key").set(headers);
    expect(res.statusCode).toBe(200);

    expect(ctx.db.ref).toHaveBeenCalledWith("/users/test-user/key");
    expect(res.body).toEqual({ key: mockData.key });
  });
  test("POST /key", async () => {
    const res = await request(keyController(app, ctx))
      .post("/key")
      .set(headers);

    console.log(res.error);
    expect(res.statusCode).toBe(201);

    expect(ctx.db.ref).toHaveBeenCalledWith("/users/test-user/key");
    // Set /users/${req.user.uid}/key
    expect(setMock).toHaveBeenNthCalledWith(1, expect.any(String));
    // Set /tokens/${key}
    expect(setMock).toHaveBeenNthCalledWith(2, "test-user");
    expect(typeof res.body.key).toBe("string");
  });

  test("GET /wallet", async () => {
    const res = await request(walletController(app, ctx))
      .get("/wallet")
      .set(headers);
    expect(res.statusCode).toBe(200);

    expect(ctx.db.ref).toHaveBeenCalledWith("/users/test-user/wallet");
    expect(res.body).toEqual({ wallet: "test-wallet" });
  });
  test("POST /wallet", async () => {
    const res = await request(walletController(app, ctx))
      .post("/wallet")
      .set(headers)
      .send({
        wallet: mockData.wallet,
      });

    console.log(res.error);
    expect(res.statusCode).toBe(201);

    expect(ctx.db.ref).toHaveBeenCalledWith("/users/test-user/wallet");
    expect(setMock).toHaveBeenCalledWith(mockData.wallet);
    expect(typeof res.body.wallet).toBe("string");
  });

  test.only("POST /checkout", async () => {
    const res = await request(checkoutController(app, ctx))
      .post("/checkout")
      .set(headers)
      .send({
        paymentId: "paymentId",
        amount: "100",
        address: "merchant-address",
        timestamp: Date.now(),
        redirectURL: "https://example.com",
      });

    console.log(res.error);
    expect(res.statusCode).toBe(201);

    // expect(ctx.db.ref).toHaveBeenCalledWith("/users/test-user/checkout");
    // expect(setMock).toHaveBeenCalledWith(mockData.checkout);
    // expect(typeof res.body.checkout).toBe("string");
  });
});
