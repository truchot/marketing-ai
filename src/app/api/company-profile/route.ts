import { NextRequest, NextResponse } from "next/server";
import { getCompanyProfile, setCompanyProfile } from "@/data/company-profile";

export async function GET() {
  const profile = getCompanyProfile();
  return NextResponse.json({ profile });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, sector, description, target, brandTone } = body;

  if (!name || !sector || !description || !target || !brandTone) {
    return NextResponse.json(
      { error: "Tous les champs sont requis." },
      { status: 400 }
    );
  }

  const profile = setCompanyProfile({
    name,
    sector,
    description,
    target,
    brandTone,
  });

  return NextResponse.json({ profile });
}
