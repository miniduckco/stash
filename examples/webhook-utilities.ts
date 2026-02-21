import { buildFormEncoded, parseFormBody } from "@miniduck/stash";

const body = buildFormEncoded({ payment_status: "COMPLETE", amount: 100 });
const pairs = parseFormBody(body);

console.log(body, pairs);
