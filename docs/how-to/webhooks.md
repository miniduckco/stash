# Verify webhooks with raw body

Webhook verification fails most often when frameworks mutate the request body before you verify it. Always verify against the raw body.

## Common pitfalls

- JSON/body parsers run before verification
- Whitespace or encoding changes
- Form field order changes (some providers require it)

## Express

```ts
import express from "express";
import { createStash, StashError } from "@miniduckco/stash";

const app = express();

const stash = createStash({
  provider: "payfast",
  credentials: {
    merchantId: process.env.PAYFAST_MERCHANT_ID,
    merchantKey: process.env.PAYFAST_MERCHANT_KEY,
    passphrase: process.env.PAYFAST_PASSPHRASE,
  },
});

app.use(
  "/webhooks/payfast",
  express.urlencoded({
    extended: false,
    verify: (req, _res, buf) => {
      (req as any).rawBody = buf.toString("utf8");
    },
  })
);

app.post("/webhooks/payfast", (req, res) => {
  try {
    const parsed = stash.webhooks.parse({
      rawBody: (req as any).rawBody,
      headers: req.headers,
    });

    if (parsed.event.type === "payment.completed") {
      // update order
    }

    res.status(200).send("OK");
  } catch (error) {
    if (error instanceof StashError && error.code === "invalid_signature") {
      res.status(400).send("Invalid signature");
      return;
    }
    res.status(500).send("Error");
  }
});
```

## Next.js Route Handler (App Router)

```ts
import { createStash, StashError } from "@miniduckco/stash";

const stash = createStash({
  provider: "ozow",
  credentials: {
    siteCode: process.env.OZOW_SITE_CODE,
    apiKey: process.env.OZOW_API_KEY,
    privateKey: process.env.OZOW_PRIVATE_KEY,
  },
});

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const parsed = stash.webhooks.parse({
      rawBody,
      headers: Object.fromEntries(request.headers.entries()),
    });

    if (parsed.event.type === "payment.completed") {
      // update order
    }

    return new Response("OK", { status: 200 });
  } catch (error) {
    if (error instanceof StashError && error.code === "invalid_signature") {
      return new Response("Invalid signature", { status: 400 });
    }
    return new Response("Error", { status: 500 });
  }
}
```

## Fastify

```ts
import Fastify from "fastify";
import { createStash, StashError } from "@miniduckco/stash";

const fastify = Fastify();

const stash = createStash({
  provider: "payfast",
  credentials: {
    merchantId: process.env.PAYFAST_MERCHANT_ID,
    merchantKey: process.env.PAYFAST_MERCHANT_KEY,
    passphrase: process.env.PAYFAST_PASSPHRASE,
  },
});

fastify.addHook("onRequest", async (request) => {
  const buffers: Buffer[] = [];
  for await (const chunk of request.raw) {
    buffers.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  (request as any).rawBody = Buffer.concat(buffers).toString("utf8");
});

fastify.post("/webhooks/payfast", async (request, reply) => {
  try {
    const parsed = stash.webhooks.parse({
      rawBody: (request as any).rawBody,
      headers: request.headers as Record<string, string | string[] | undefined>,
    });

    if (parsed.event.type === "payment.completed") {
      // update order
    }

    reply.code(200).send("OK");
  } catch (error) {
    if (error instanceof StashError && error.code === "invalid_signature") {
      reply.code(400).send("Invalid signature");
      return;
    }
    reply.code(500).send("Error");
  }
});
```

Note: content-type checks are optional and left to the caller.
