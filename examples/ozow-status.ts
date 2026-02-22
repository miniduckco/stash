import { getOzowTransactionStatusByReference } from "@miniduckco/stash";

const status = await getOzowTransactionStatusByReference({
  siteCode: process.env.OZOW_SITE_CODE,
  apiKey: process.env.OZOW_API_KEY,
  transactionReference: "ORDER-12345",
  testMode: true,
});

console.log(status.transactions);
