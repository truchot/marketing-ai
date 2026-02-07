import { NextRequest, NextResponse } from "next/server";
import { getProfileUseCase, createProfileUseCase } from "@/infrastructure/composition-root";

export async function GET() {
  const result = getProfileUseCase.execute();
  if (result.isErr()) {
    return NextResponse.json(
      { error: result.error.message },
      { status: 500 }
    );
  }
  return NextResponse.json({ profile: result.value });
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

  const result = createProfileUseCase.execute({ name, sector, description, target, brandTone });
  if (result.isErr()) {
    return NextResponse.json(
      { error: result.error.message },
      { status: result.error.code === "VALIDATION_ERROR" ? 400 : 500 }
    );
  }

  return NextResponse.json({ profile: result.value }, { status: 201 });
}
