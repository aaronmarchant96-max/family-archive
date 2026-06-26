import { NextResponse } from "next/server";
import peopleData from "../../../../data/people.json";
import {
  canonicalEvents,
  fullEvents,
  mrcmRecords,
  reviewEvents,
  type MrcmEvent,
  type MrcmRecord,
} from "../../../../lib/mrcm";

const people = peopleData as Array<Record<string, unknown>>;

function filterEvents(events: MrcmEvent[], searchParams: URLSearchParams) {
  const classFilter = searchParams.get("class");
  const confidenceFilter = searchParams.get("confidence");
  const branchFilter = searchParams.get("branch");
  const personFilter = searchParams.get("person");

  return events.filter((event) => {
    if (classFilter && event.event_class !== classFilter) return false;
    if (confidenceFilter && event.confidence_tier !== confidenceFilter) return false;
    if (branchFilter && event.branch !== branchFilter) return false;
    if (personFilter && event.person_id !== personFilter && !event.related_person_ids.includes(personFilter)) return false;
    return true;
  });
}

function findEventById(eventId: string) {
  return fullEvents.find((event) => event.event_id === eventId || event.canonical_event_id === eventId);
}

function findRecordById(recordId: string) {
  return mrcmRecords.find((record) => record.record_id === recordId || record.canonical_event_id === recordId);
}

function findPersonById(personId: string) {
  return people.find((person) => person.id === personId);
}

export function GET(request: Request, { params }: { params: { path: string[] } }) {
  const [resource, id] = params.path;
  const searchParams = new URL(request.url).searchParams;

  if (resource === "events") {
    if (id) {
      const event = findEventById(id);
      if (!event) return NextResponse.json({ error: "not found" }, { status: 404 });
      return NextResponse.json(event);
    }
    return NextResponse.json(filterEvents(canonicalEvents, searchParams));
  }

  if (resource === "records") {
    if (id) {
      const record = findRecordById(id);
      if (!record) return NextResponse.json({ error: "not found" }, { status: 404 });
      return NextResponse.json(record);
    }
    return NextResponse.json(mrcmRecords);
  }

  if (resource === "people") {
    if (id) {
      const person = findPersonById(id);
      if (!person) return NextResponse.json({ error: "not found" }, { status: 404 });
      return NextResponse.json({
        ...person,
        related_events: fullEvents.filter((event) => event.person_id === id || event.related_person_ids.includes(id)),
      });
    }
    return NextResponse.json(people);
  }

  if (resource === "proof-trails") {
    const trailId = id ?? searchParams.get("trail_id") ?? "";
    if (!trailId) return NextResponse.json({ error: "missing trail id" }, { status: 400 });
    const trail = {
      trail_id: trailId,
      records: mrcmRecords.filter((record) => record.links.related_record_ids.includes(trailId) || record.person_id === trailId),
    };
    return NextResponse.json(trail);
  }

  if (resource === "changelog") {
    return NextResponse.json({
      generated_at_utc: new Date().toISOString(),
      counts: {
        people: people.length,
        events: fullEvents.length,
        canonical_events: canonicalEvents.length,
        review_events: reviewEvents.length,
        records: mrcmRecords.length,
      },
    });
  }

  return NextResponse.json({ error: "not found" }, { status: 404 });
}
