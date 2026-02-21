import { createStash } from "@miniduck/stash";

const stash = createStash({
  provider: "paystack",
  credentials: {
    secretKey: process.env.PAYSTACK_SECRET_KEY,
  },
});

const payment = await stash.payments.create({
  amount: 2500,
  currency: "ZAR",
  reference: "ORDER-12345",
  customer: {
    email: "buyer@example.com",
  },
  providerOptions: {
    channels: ["card"],
  },
});

console.log(payment.redirectUrl);
