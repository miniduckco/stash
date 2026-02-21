import { createStash } from "@miniduck/stash";

const stash = createStash({
  provider: "payfast",
  credentials: {
    merchantId: process.env.PAYFAST_MERCHANT_ID,
    merchantKey: process.env.PAYFAST_MERCHANT_KEY,
    passphrase: process.env.PAYFAST_PASSPHRASE,
  },
});

const { event } = stash.webhooks.parse({ rawBody: req.rawBody });

if (event.type === "payment.completed") {
  // update order
}

res.status(200).send("OK");
