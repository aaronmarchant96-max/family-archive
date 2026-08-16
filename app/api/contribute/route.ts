import { NextResponse } from "next/server";
import { addContribution, getContributions } from "../../../lib/contributionStore";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const contributions = await getContributions();
    return NextResponse.json({ success: true, contributions });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to fetch contributions", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON payload in request body" },
        { status: 400 }
      );
    }

    // Validate request structure explicitly
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Invalid payload: Body must be an object" },
        { status: 400 }
      );
    }

    const { targetPersonId, contributorName, type, content, idempotencyKey } = body;

    if (!targetPersonId || typeof targetPersonId !== "string" || targetPersonId.trim().length === 0) {
      return NextResponse.json(
        { error: "Missing or invalid field: targetPersonId" },
        { status: 422 }
      );
    }

    if (!contributorName || typeof contributorName !== "string" || contributorName.trim().length === 0) {
      return NextResponse.json(
        { error: "Missing or invalid field: contributorName" },
        { status: 422 }
      );
    }

    if (!["story", "photo", "correction"].includes(type)) {
      return NextResponse.json(
        { error: "Invalid contribution type. Must be 'story', 'photo', or 'correction'" },
        { status: 422 }
      );
    }

    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return NextResponse.json(
        { error: "Contribution content cannot be empty" },
        { status: 422 }
      );
    }

    // Generate or use provided idempotency key
    const effectiveKey =
      typeof idempotencyKey === "string" && idempotencyKey.length > 0
        ? idempotencyKey
        : `${targetPersonId}-${type}-${Buffer.from(content.trim()).toString("base64").substring(0, 32)}`;

    const { contribution, created } = await addContribution({
      targetPersonId: targetPersonId.trim(),
      contributorName: contributorName.trim(),
      type,
      content: content.trim(),
      idempotencyKey: effectiveKey
    });

    return NextResponse.json(
      { success: true, contribution },
      { status: created ? 201 : 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: "Internal server error processing contribution", details: error.message },
      { status: 500 }
    );
  }
}
