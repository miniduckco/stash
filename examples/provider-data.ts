import { makePayment } from "@miniduck/stash";

await makePayment({
  provider: "payfast",
  amount: "100.00",
  reference: "ORDER-1",
  secrets: {
    merchantId: process.env.PAYFAST_MERCHANT_ID,
    merchantKey: process.env.PAYFAST_MERCHANT_KEY,
  },
  providerData: {
    payment_method: "cc",
    email_confirmation: "1",
  },
});
