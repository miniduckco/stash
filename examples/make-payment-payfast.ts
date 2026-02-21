import { makePayment } from "@miniduck/stash";

const payment = await makePayment({
  provider: "payfast",
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
  secrets: {
    merchantId: process.env.PAYFAST_MERCHANT_ID,
    merchantKey: process.env.PAYFAST_MERCHANT_KEY,
    passphrase: process.env.PAYFAST_PASSPHRASE,
  },
  providerOptions: {
    paymentMethod: "cc",
    emailConfirmation: true,
  },
  testMode: true,
});

console.log(payment.redirectUrl, payment.formFields);
