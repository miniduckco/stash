import { createStash } from "@miniduckco/stash";

const stash = createStash({
  provider: "payfast",
  credentials: {
    merchantId: process.env.PAYFAST_MERCHANT_ID,
    merchantKey: process.env.PAYFAST_MERCHANT_KEY,
    passphrase: process.env.PAYFAST_PASSPHRASE,
  },
  testMode: true,
});

const payment = await stash.payments.create({
  amount: "249.99",
  currency: "ZAR",
  reference: "ORDER-12345",
  description: "Order #12345",
  customer: {
    firstName: "Lebo",
    lastName: "Nkosi",
    email: "lebo@example.com",
  },
  urls: {
    returnUrl: "https://shop.example.com/payments/return",
    cancelUrl: "https://shop.example.com/payments/cancel",
    notifyUrl: "https://shop.example.com/payments/webhook",
  },
  providerOptions: {
    paymentMethod: "cc",
    emailConfirmation: true,
  },
});

console.log(payment.redirectUrl);
