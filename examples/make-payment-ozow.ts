import { makePayment } from "@miniduck/stash";

const payment = await makePayment({
  provider: "ozow",
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
  secrets: {
    siteCode: process.env.OZOW_SITE_CODE,
    apiKey: process.env.OZOW_API_KEY,
    privateKey: process.env.OZOW_PRIVATE_KEY,
  },
  testMode: true,
});

console.log(payment.redirectUrl);
