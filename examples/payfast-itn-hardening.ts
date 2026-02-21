import { validatePayfastWebhookSignature } from "@miniduck/stash";

const validation = await validatePayfastWebhookSignature({
  rawBody: req.rawBody,
  passphrase: process.env.PAYFAST_PASSPHRASE,
  mode: "sandbox",
  validateServer: true,
});

if (!validation.isValid) {
  res.status(400).send("Invalid ITN");
} else {
  res.status(200).send("OK");
}
