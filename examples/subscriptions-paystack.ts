import { createStash } from "@miniduckco/stash";

const stash = createStash({
  provider: "paystack",
  credentials: {
    secretKey: process.env.PAYSTACK_SECRET_KEY ?? "",
  },
});

async function main() {
  if (!process.env.PAYSTACK_SECRET_KEY) {
    throw new Error("Missing PAYSTACK_SECRET_KEY env var");
  }
  if (!process.env.PAYSTACK_CUSTOMER_CODE) {
    throw new Error("Missing PAYSTACK_CUSTOMER_CODE env var");
  }

  const plan = await stash.subscriptions.plans.create({
    name: "Monthly Retainer",
    interval: "monthly",
    amount: "5000.00",
    amountUnit: "major",
    currency: "ZAR",
  });

  const subscription = await stash.subscriptions.create({
    customer: process.env.PAYSTACK_CUSTOMER_CODE,
    plan: plan.planCode,
    authorization: process.env.PAYSTACK_AUTH_CODE,
  });

  console.log({ plan, subscription });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
