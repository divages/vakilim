import { NextResponse } from "next/server";

/** Superseded by the two-phase signup (signup-start / signup-complete)
 *  which verifies the phone before an account exists. */
export async function POST() {
  return NextResponse.json({ ok: false, error: "GONE" }, { status: 410 });
}
