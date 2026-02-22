import { buildFormEncoded, parseFormBody } from "@miniduckco/stash";

const body = buildFormEncoded({ payment_status: "COMPLETE", amount: 100 });
const pairs = parseFormBody(body);

console.log(body, pairs);
