import { NextResponse } from "next/server";
import { keccak256, toBytes } from "viem";
import { validateAttestationInput, appendIndex, type AttestationRecord } from "@/lib/attestation-index";
import { getOnchainAttestation } from "@/lib/eas";
import { getReportBody } from "@/lib/reports";

export async function POST(req: Request) {
  let body: AttestationRecord;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "bad json" }, { status: 400 }); }

  try {
    validateAttestationInput(body);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }

  // Re-verify the on-chain attestation independently (do not trust the client).
  let onchain;
  try {
    onchain = await getOnchainAttestation(body.attestationUID);
  } catch {
    return NextResponse.json({ error: "attestation not found on-chain" }, { status: 400 });
  }
  if (onchain.attester.toLowerCase() !== body.author.toLowerCase())
    return NextResponse.json({ error: "attester mismatch" }, { status: 400 });
  if (onchain.fields.slug !== body.slug)
    return NextResponse.json({ error: "slug mismatch" }, { status: 400 });
  if (onchain.fields.priceUSDC.toString() !== body.priceUSDC)
    return NextResponse.json({ error: "price mismatch" }, { status: 400 });
  if (onchain.fields.version !== 1)
    return NextResponse.json({ error: "version must be 1" }, { status: 400 });

  // Disclaimer hardening: on-chain disclaimer must be <=500 chars and hash to the submitted disclaimerHash.
  if (onchain.fields.disclaimer.length > 500)
    return NextResponse.json({ error: "disclaimer too long" }, { status: 400 });
  if (keccak256(toBytes(onchain.fields.disclaimer)).toLowerCase() !== body.disclaimerHash.toLowerCase())
    return NextResponse.json({ error: "disclaimerHash mismatch" }, { status: 400 });

  // contentHash must equal keccak256 of the canonical (decrypted) body.
  const expected = keccak256(toBytes(getReportBody(body.slug)));
  if (onchain.fields.contentHash.toLowerCase() !== expected.toLowerCase())
    return NextResponse.json({ error: "contentHash mismatch" }, { status: 400 });

  appendIndex(body);
  return NextResponse.json({ ok: true, slug: body.slug });
}
