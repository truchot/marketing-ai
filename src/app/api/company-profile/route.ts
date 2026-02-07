import { NextRequest, NextResponse } from "next/server";
import { getProfileUseCase, createProfileUseCase } from "@/infrastructure/composition-root";

export async function GET() {
  const profile = getProfileUseCase.execute();
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

  const profile = createProfileUseCase.execute({ name, sector, description, target, brandTone });

  return NextResponse.json({ profile }, { status: 201 });
}
