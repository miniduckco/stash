import { createStash } from "@miniduck/stash";

const stash = createStash({
  provider: "paystack",
  credentials: {
    secretKey: process.env.PAYSTACK_SECRET_KEY,
  },
});

const { event } = stash.webhooks.parse({
  rawBody: req.rawBody,
  headers: req.headers,
});

if (event.type === "payment.completed") {
  // update order
}

res.status(200).send("OK");
