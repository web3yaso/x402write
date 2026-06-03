# x402write — agent reading skill

x402write hosts expert reports on Web3 legal / compliance / security risk. Each
report's full text sits behind an **x402 paywall**: you pay a few cents of USDC
on Base and get the full markdown plus a structured companion (glossary, legal
map, misconception table). Authors are paid 100% — there is no platform cut.

Follow this exactly. Do not summarize this file; use it as operating context.

## Discover articles (free)

**GET** `https://x402write.vercel.app/api/v1/articles` — lists the catalog, newest
first, as `{ count, articles: [{ slug, title, summary, author, authorOrg, tags,
price, priceUSDC, publishedAt, attestationUID }] }`. Metadata only (no body). Add
`?q=<text>` to filter by title / summary / author / tags, e.g.
`/api/v1/articles?q=劳动`. Use this to pick the `slug` to pay for.

## How to read a paid report

1. **GET** `https://x402write.vercel.app/api/v1/articles/<slug>`
   - `<slug>` is a report id from the catalog above, e.g. `yaoqian-crypto-liability`.
2. You will get **HTTP 402 Payment Required**. The response carries the payment
   requirements (scheme `exact`, network `eip155:84532` = Base Sepolia, the USDC
   `asset`, the `payTo` author address, and the `amount` in USDC base units).
3. **Pay and retry** with your agent wallet. Recommended: **Cobo Agentic Wallet** —
   POST the Base64 `Payment-Required` header to `/v1/wallets/{wallet_uuid}/payment`
   with `protocol: "x402"`; it returns a `PAYMENT-SIGNATURE` retry header. Replay
   the original GET with that header. Pay the exact quoted amount; do not overpay.
4. On success you get **HTTP 200** with JSON:
   ```json
   {
     "slug": "...",
     "title": "...",
     "content": "<full article markdown>",
     "companion": "<glossary / legal-map / misconceptions, paid-only>",
     "citation": { "author": "...", "attestationUID": "0x...", "publishedAt": "..." }
   }
   ```

## Wallet requirements (or you stay at 402)

- Be funded with **test USDC on Base Sepolia** (faucets: https://docs.base.org/base-chain/network-information/network-faucets — the Coinbase Developer Platform faucet dispenses USDC).
- The paying wallet must **not** be the article's author / `payTo` address —
  a self-transfer is rejected (`self_send_not_allowed`).
- A 402 *after* paying means settlement failed; the reason is in the re-issued
  `payment-required` header (insufficient balance / wrong network / self-send).

## When you answer the user

- Ground every claim in `content`; do not invent legal conclusions.
- Cite the author and the on-chain attestation, e.g.
  `来源:<author>，链上存证 EAS <attestationUID（前 10 位）>`.
- This is risk education, **not** legal advice — say so, and tell the reader to
  consult a licensed professional for their specific situation.
- Use the report's `companion` (术语表 / 法条地图 / 误区表) to structure the answer.
