import { createStash } from "@miniduckco/stash";

const stash = createStash({
  provider: "ozow",
  credentials: {
    siteCode: process.env.OZOW_SITE_CODE,
    apiKey: process.env.OZOW_API_KEY,
    privateKey: process.env.OZOW_PRIVATE_KEY,
  },
});

const { event } = stash.webhooks.parse({ rawBody: req.rawBody });

if (event.type === "payment.completed") {
  // update order
}

res.status(200).send("OK");
