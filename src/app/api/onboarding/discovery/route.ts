import { NextResponse } from "next/server";
import { businessDiscoveryRepository } from "@/data/business-discovery-repository";

// GET /api/onboarding/discovery
// Returns the latest persisted BusinessDiscovery (produced at the end of
// onboarding), so the strategy session can seed the diagnostic with real
// context. Returns { discovery: null } when none has been captured yet.
export async function GET() {
  const discovery = businessDiscoveryRepository.getLatest();
  return NextResponse.json({ discovery });
}
