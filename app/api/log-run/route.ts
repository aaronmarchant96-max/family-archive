import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const dataDir = path.join(process.cwd(), "data");
    const logPath = path.join(dataDir, "game_runs.jsonl");

    const entry = {
      timestamp: new Date().toISOString(),
      clanName: body.clanName || "Unknown",
      outcome: body.outcome || "defeat",
      milesReached: body.milesReached || 0,
      daysElapsed: body.daysElapsed || 0,
      wheelsRemaining: body.wheelsRemaining || 0,
      graveLog: body.graveLog || []
    };

    // Append as a single JSON line
    await fs.appendFile(logPath, JSON.stringify(entry) + "\n", "utf-8");

    return NextResponse.json({ success: true, logged: entry });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
