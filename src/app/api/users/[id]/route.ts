import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getDbUser } from "@/lib/auth";

const MAX_BIO_LENGTH = 300;

export async function PATCH(
  req: Request,
  { params }: RouteContext<"/api/users/[id]">,
) {
  try {
    const user = await getDbUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    if (id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const data: Record<string, unknown> = {};

    if (typeof body.bio === "string") {
      if (body.bio.trim().length > MAX_BIO_LENGTH) {
        return NextResponse.json(
          { error: `Bio must be ${MAX_BIO_LENGTH} characters or fewer` },
          { status: 400 },
        );
      }
      data.bio = body.bio.trim() || null;
    }
    if (typeof body.district === "string") {
      data.district = body.district.trim() || null;
    }
    if (typeof body.locationDetail === "string") {
      data.locationDetail = body.locationDetail.trim() || null;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    const updated = await db.user.update({ where: { id }, data });

    return NextResponse.json({ user: updated });
  } catch (error) {
    console.error("[api/users/:id] PATCH failed:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
