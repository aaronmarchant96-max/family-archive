import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

type GamePerson = {
  person_id: string;
  name: string;
  birth_year?: string | number;
  birth?: string;
  death_year?: string | number;
  death?: string;
};

type GameEvent = {
  summary?: string;
  date_year?: number;
  date?: string;
  place?: string;
};

// Helper to safely parse year from text
function parseYear(val: string | undefined): number {
  if (!val) return 1850;
  const match = val.match(/(1[0-9]{3})/);
  return match ? parseInt(match[1], 10) : 1850;
}

export async function GET() {
  try {
    const dataDir = path.join(process.cwd(), "data");
    const peoplePath = path.join(dataDir, "people.json");
    const eventsPath = path.join(dataDir, "canonical_events.json");

    // Read static JSON files
    const peopleRaw = await fs.readFile(peoplePath, "utf-8");
    const eventsRaw = await fs.readFile(eventsPath, "utf-8");

    const people = JSON.parse(peopleRaw) as GamePerson[];
    const events = JSON.parse(eventsRaw) as GameEvent[];

    const peopleById = new Map<string, GamePerson>(people.map((p) => [p.person_id, p]));

    // 1. Dynamic Crew Generation from Dyers and Ramseys in people.json
    const getMemberDetails = (id: string, defaultName: string, trait: string) => {
      const p = peopleById.get(id);
      if (p) {
        return {
          name: p.name,
          trait,
          birth: p.birth_year || p.birth || "Unknown",
          death: p.death_year || p.death || "Unknown",
        };
      }
      return { name: defaultName, trait, birth: "Unknown", death: "Unknown" };
    };

    const dyerCrew = [
      getMemberDetails("george-washington-dyer", "George Washington Dyer", "Resilient"),
      getMemberDetails("elizabeth-ellen-conley", "Elizabeth Ellen Conlee", "Wise"),
      getMemberDetails("glenn-milton-dyer", "Glenn Milton Dyer", "Athletic"),
      getMemberDetails("george-hollis-dyer", "George Hollis Dyer", "Charming"),
    ];

    const ramseyCrew = [
      getMemberDetails("armina-ramsey", "Armina Ramsey", "Resilient"),
      getMemberDetails("anderson-edwards", "Anderson Edwards", "Athletic"),
      getMemberDetails("silas-josiah-edwards", "Silas Josiah Edwards", "Charming"),
      getMemberDetails("edith-ann-edwards", "Edith Ann Edwards", "Wise"),
    ];

    // 2. Dynamic Event Generation: Map real timeline events to game-ready incidents
    // We select 5 notable timeline events and format them as moral dilemmas
    const dynamicEvents: any[] = [];
    const targetEvents = events.filter((ev: any) => {
      const lowered = (ev.summary || "").toLowerCase();
      return (
        lowered.includes("migration") ||
        lowered.includes("wagon") ||
        lowered.includes("settled") ||
        lowered.includes("crossing") ||
        lowered.includes("land")
      );
    }).slice(0, 6);

    targetEvents.forEach((ev: any, idx: number) => {
      const year = ev.date_year || parseYear(ev.date);
      dynamicEvents.push({
        id: `historical_event_${idx}`,
        title: `Historical event: ${year}`,
        text: `In ${year}, your records show: ${ev.summary || "A major crossing occurrs on the trail."} At ${ev.place || "the frontier"}, how does your caravan navigate this step?`,
        options: [
          {
            label: "Follow historical precedent",
            detail: "Do exactly what was written in the archives.",
            apply: "addKarma(10); addDistance(8); logLine('You choose the path recorded in the letters.', 'good');"
          },
          {
            label: "Take a resource-first shortcut",
            detail: "Ignore precedent to hoard supplies.",
            apply: "addKarma(-12); addRations(10); logLine('The shortcut pays in bread but costs in reputation.', 'bad');"
          },
          {
            label: "Invest time to document the route",
            detail: "Spend a day taking logs.",
            apply: "addKarma(15); addDistance(-5); addMorale(2); logLine('You take logs of the water crossings.', 'good');"
          }
        ]
      });
    });

    return NextResponse.json({
      success: true,
      crews: {
        dyer: {
          name: "Dyer Clan",
          intro: "George Washington Dyer led his caravan from Indiana to Pine City, Washington.",
          crew: dyerCrew
        },
        ramsey: {
          name: "Ramsey Clan",
          intro: "Armina Ramsey's descendants traveled through Tennessee, Iowa, and Washington.",
          crew: ramseyCrew
        }
      },
      dynamicEvents
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
