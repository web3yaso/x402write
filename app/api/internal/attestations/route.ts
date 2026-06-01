import { NextResponse } from "next/server";
import { keccak256, toBytes } from "viem";
import { validateAttestationInput, appendIndex, hasSlug, type AttestationRecord } from "@/lib/attestation-index";
import { getOnchainAttestation } from "@/lib/eas";
import { getReportBody } from "@/lib/reports";

export async function POST(req: Request) {
  let body: AttestationRecord;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "bad json" }, { status: 400 }); }

  // Format validation of the submitted payload (hex shapes, ranges, etc.).
  try {
    validateAttestationInput(body);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }

  // First-write-wins: reject if this slug is already claimed (prevents authorship/payout
  // hijack by re-attesting + replacing). Fail fast before any network call.
  if (hasSlug(body.slug))
    return NextResponse.json({ error: "slug already published" }, { status: 409 });

  // Re-verify the on-chain attestation independently (do not trust the client).
  let onchain;
  try {
    onchain = await getOnchainAttestation(body.attestationUID);
  } catch {
    return NextResponse.json({ error: "attestation not found on-chain" }, { status: 400 });
  }
  if (onchain.revoked)
    return NextResponse.json({ error: "attestation revoked" }, { status: 400 });
  if (onchain.attester.toLowerCase() !== body.author.toLowerCase())
    return NextResponse.json({ error: "attester mismatch" }, { status: 400 });
  if (onchain.fields.slug !== body.slug)
    return NextResponse.json({ error: "slug mismatch" }, { status: 400 });
  if (onchain.fields.priceUSDC.toString() !== body.priceUSDC)
    return NextResponse.json({ error: "price mismatch" }, { status: 400 });
  if (onchain.fields.version !== 1)
    return NextResponse.json({ error: "version must be 1" }, { status: 400 });

  const onchainPublishedAt = Number(onchain.fields.publishedAt);
  if (onchainPublishedAt <= 0 || onchainPublishedAt > Math.floor(Date.now() / 1000))
    return NextResponse.json({ error: "invalid on-chain publishedAt" }, { status: 400 });

  // Disclaimer hardening: on-chain disclaimer must be <=500 chars and hash to the submitted disclaimerHash.
  if (onchain.fields.disclaimer.length > 500)
    return NextResponse.json({ error: "disclaimer too long" }, { status: 400 });
  const onchainDisclaimerHash = keccak256(toBytes(onchain.fields.disclaimer));
  if (onchainDisclaimerHash.toLowerCase() !== body.disclaimerHash.toLowerCase())
    return NextResponse.json({ error: "disclaimerHash mismatch" }, { status: 400 });

  // contentHash must equal keccak256 of the canonical (decrypted) body.
  const expected = keccak256(toBytes(getReportBody(body.slug)));
  if (onchain.fields.contentHash.toLowerCase() !== expected.toLowerCase())
    return NextResponse.json({ error: "contentHash mismatch" }, { status: 400 });

  // Persist values DERIVED FROM ON-CHAIN TRUTH, not the client-supplied body
  // (author/price/publishedAt/version/disclaimerHash all come from the attestation).
  // Only attestationUID and txHash (informational, hex-validated) are taken from the client.
  const record: AttestationRecord = {
    slug: onchain.fields.slug,
    attestationUID: body.attestationUID,
    txHash: body.txHash,
    author: onchain.attester,
    priceUSDC: onchain.fields.priceUSDC.toString(),
    publishedAt: onchainPublishedAt,
    version: onchain.fields.version,
    disclaimerHash: onchainDisclaimerHash,
  };
  try {
    appendIndex(record);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 409 });
  }
  return NextResponse.json({ ok: true, slug: record.slug });
}
