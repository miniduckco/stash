import { verifyWebhookSignature } from "@miniduck/stash";

const result = verifyWebhookSignature({
  provider: "payfast",
  rawBody: req.rawBody,
  secrets: {
    passphrase: process.env.PAYFAST_PASSPHRASE,
  },
});

if (!result.isValid) {
  res.status(400).send("Invalid signature");
} else {
  res.status(200).send("OK");
}
