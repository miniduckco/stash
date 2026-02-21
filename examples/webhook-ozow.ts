import { verifyWebhookSignature } from "@miniduck/stash";

const result = verifyWebhookSignature({
  provider: "ozow",
  rawBody: req.rawBody,
  secrets: {
    privateKey: process.env.OZOW_PRIVATE_KEY,
  },
});

if (!result.isValid) {
  res.status(400).send("Invalid signature");
} else {
  res.status(200).send("OK");
}
