import { createStash } from "@miniduckco/stash";

const stash = createStash({
  provider: "ozow",
  credentials: {
    siteCode: process.env.OZOW_SITE_CODE,
    apiKey: process.env.OZOW_API_KEY,
    privateKey: process.env.OZOW_PRIVATE_KEY,
  },
  testMode: true,
});

const payment = await stash.payments.create({
  amount: "249.99",
  currency: "ZAR",
  reference: "ORDER-12345",
  customer: {
    firstName: "Lebo",
    lastName: "Nkosi",
    phone: "0821234567",
  },
  urls: {
    returnUrl: "https://shop.example.com/payments/return",
    cancelUrl: "https://shop.example.com/payments/cancel",
    notifyUrl: "https://shop.example.com/payments/webhook",
    errorUrl: "https://shop.example.com/payments/error",
  },
});

console.log(payment.redirectUrl);
