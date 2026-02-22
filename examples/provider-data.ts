import { createStash } from "@miniduckco/stash";

const stash = createStash({
  provider: "payfast",
  credentials: {
    merchantId: process.env.PAYFAST_MERCHANT_ID,
    merchantKey: process.env.PAYFAST_MERCHANT_KEY,
  },
});

await stash.payments.create({
  amount: "100.00",
  reference: "ORDER-1",
  providerData: {
    payment_method: "cc",
    email_confirmation: "1",
  },
});
