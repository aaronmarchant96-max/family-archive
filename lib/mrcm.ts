import fullEventsData from "../data/full_events.json";
import canonicalEventsData from "../data/canonical_events.json";
import reviewEventsData from "../data/review_events.json";
import mrcmRecordsData from "../data/mrcm_records.json";
import peopleData from "../data/people.json";

export type EventClass = "FACT_EVENT" | "RELATION_EVENT" | "RESEARCH_NOTE";
export type ConfidenceTier = "PRIMARY" | "STRONG" | "NEEDS_REVIEW" | "FAMILY_MEMORY" | "CORROBORATED_COMPILATION";

export interface MrcmEvent {
  event_id: string;
  person_id: string;
  title: string;
  event_type: string;
  date: string;
  raw_date?: string;
  date_year?: string;
  normalized_date_start?: string | null;
  normalized_date_end?: string | null;
  date_precision?: string;
  place?: string;
  normalized_place?: string;
  confidence?: string;
  confidence_tier: ConfidenceTier;
  summary: string;
  notes?: string;
  linked_document_id?: string;
  source_document_ids: string[];
  related_person_ids: string[];
  event_class: EventClass;
  event_key: string;
  canonical_key: string;
  canonical_event_id: string;
  duplicate_of?: string | null;
  conflict_tags: string[];
  branch?: string;
  source_row_key?: string;
  source_person_name?: string;
  duplicate_count?: number;
}

export interface MrcmRecord {
  schema_version: "mrcm.v1";
  record_id: string;
  title: string;
  record_type: EventClass;
  evidence_tier: ConfidenceTier;
  date: {
    raw: string;
    iso_start: string | null;
    iso_end: string | null;
    precision: string;
  };
  people_ids: string[];
  place_ids: string[];
  branches: string[];
  source_citation: string;
  artifact_access: {
    kind: "PUBLIC" | "PRIVATE" | "METADATA_ONLY";
    url: string | null;
  };
  claims: {
    fact_statement: string;
    meaning_statement: string;
    uncertainty_statement: string | null;
  };
  provenance: {
    source_file: string;
    source_row_key: string;
    etl_run_id: string;
    generated_at_utc: string | null;
  };
  flags: {
    identity_bridge_required: boolean;
    contains_name_variant: boolean;
    chronology_exception_applied: boolean;
  };
  links: {
    ui_record_url: string;
    related_record_ids: string[];
  };
  canonical_event_id: string;
  event_class: EventClass;
  confidence_tier: ConfidenceTier;
  conflict_tags: string[];
  duplicate_of: string | null;
  related_person_ids: string[];
  source_document_ids: string[];
  normalized_date_start: string | null;
  normalized_date_end: string | null;
  normalized_place: string;
  event_key: string;
  person_id: string;
  source_document_id: string;
}

export interface AncestorBrief {
  id: string;
  name: string;
  branch: string;
  confidence: string;
}

export const fullEvents = fullEventsData as MrcmEvent[];
export const canonicalEvents = canonicalEventsData as MrcmEvent[];
export const reviewEvents = reviewEventsData as MrcmEvent[];
export const mrcmRecords = mrcmRecordsData as MrcmRecord[];
export const people = peopleData as AncestorBrief[];

const eventOrder: Record<EventClass, number> = {
  FACT_EVENT: 0,
  RELATION_EVENT: 1,
  RESEARCH_NOTE: 2
};

export function buildCanonicalKey(personId: string, eventType: string, normalizedDateStart: string | null, normalizedPlace: string) {
  return [personId, eventType.toLowerCase().trim(), normalizedDateStart ?? "", normalizedPlace.toLowerCase().trim()].join("|");
}

export function canonicalEventIdFromKey(key: string) {
  return `canonical-${key
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")}`;
}

export function sortEvents(events: MrcmEvent[]) {
  return [...events].sort((left, right) => {
    const leftDate = left.normalized_date_start ?? left.normalized_date_end ?? "9999-12-31";
    const rightDate = right.normalized_date_start ?? right.normalized_date_end ?? "9999-12-31";
    return (
      leftDate.localeCompare(rightDate) ||
      eventOrder[left.event_class] - eventOrder[right.event_class] ||
      left.person_id.localeCompare(right.person_id) ||
      left.event_key.localeCompare(right.event_key)
    );
  });
}

export function queueEvents(events: MrcmEvent[]) {
  return events.filter((event) => event.confidence_tier === "NEEDS_REVIEW" || event.conflict_tags.length > 0);
}

export function eventDisplayKind(event: MrcmEvent) {
  if (event.event_class === "RESEARCH_NOTE") return "Research note";
  if (event.event_class === "RELATION_EVENT") return "Related event";
  return "Direct event";
}

export function eventDuplicateLabel(event: MrcmEvent) {
  const text = `${event.title} ${event.summary}`.toLowerCase();
  if (text.includes("marriage") || text.includes("husband") || text.includes("wife") || text.includes("spouse")) {
    return "Also shown on: Spouse";
  }
  if (text.includes("birth") || text.includes("born") || text.includes("son of") || text.includes("daughter of") || text.includes("child of")) {
    return "Also shown on: Parent/Child";
  }
  if (event.event_class !== "RELATION_EVENT") {
    return event.related_person_ids.length ? "Also referenced on related profiles" : "";
  }
  return "Also shown on: Related profile";
}

export function eventConfidenceLabel(event: MrcmEvent) {
  switch (event.confidence_tier) {
    case "PRIMARY":
      return "PRIMARY";
    case "STRONG":
      return "STRONG";
    case "CORROBORATED_COMPILATION":
      return "CORROBORATED_COMPILATION";
    case "FAMILY_MEMORY":
      return "FAMILY_MEMORY";
    default:
      return "NEEDS_REVIEW";
  }
}

export function eventsForPeople(peopleIds: Set<string>, events: MrcmEvent[], options: {
  canonicalOnly: boolean;
  includeRelationalEchoes: boolean;
  needsReviewOnly: boolean;
  conflictOnly: boolean;
  queueOnly: boolean;
}) {
  const source = options.canonicalOnly ? canonicalEvents : events;
  return sortEvents(
    source.filter((event) => {
      if (!peopleIds.has(event.person_id)) return false;
      if (options.queueOnly && event.confidence_tier !== "NEEDS_REVIEW" && event.conflict_tags.length === 0) return false;
      if (options.needsReviewOnly && event.confidence_tier !== "NEEDS_REVIEW") return false;
      if (options.conflictOnly && event.conflict_tags.length === 0) return false;
      if (!options.includeRelationalEchoes && event.event_class === "RELATION_EVENT") return false;
      if (options.canonicalOnly && event.duplicate_of) return false;
      return true;
    })
  );
}

export function peopleInQueue(peopleIds: Set<string>) {
  const queueIds = new Set<string>();
  for (const event of queueEvents(fullEvents)) {
    if (peopleIds.has(event.person_id)) {
      queueIds.add(event.person_id);
    }
  }
  return queueIds;
}

export function validateEventRecords(events: MrcmEvent[]) {
  const errors: string[] = [];
  const validClasses = new Set<EventClass>(["FACT_EVENT", "RELATION_EVENT", "RESEARCH_NOTE"]);
  const validTiers = new Set<ConfidenceTier>(["PRIMARY", "STRONG", "NEEDS_REVIEW", "FAMILY_MEMORY", "CORROBORATED_COMPILATION"]);
  const canonicalIds = new Set(events.map((event) => event.canonical_event_id));

  for (const event of events) {
    if (!event.event_class || !validClasses.has(event.event_class)) {
      errors.push(`${event.event_id}: invalid event_class`);
    }
    if (!validTiers.has(event.confidence_tier)) {
      errors.push(`${event.event_id}: invalid confidence_tier`);
    }
    if (event.duplicate_of && !canonicalIds.has(event.duplicate_of)) {
      errors.push(`${event.event_id}: invalid duplicate_of reference`);
    }
  }

  const grouped = new Map<string, MrcmEvent[]>();
  for (const event of events) {
    const eventsForKey = grouped.get(event.canonical_key) ?? [];
    eventsForKey.push(event);
    grouped.set(event.canonical_key, eventsForKey);
  }

  grouped.forEach((group, key) => {
    const factEvents = group.filter((event: MrcmEvent) => event.event_class === "FACT_EVENT");
    if (factEvents.length > 1) {
      const signatures = new Set(factEvents.map((event: MrcmEvent) => `${event.title}|${event.summary}|${event.normalized_place}`));
      if (signatures.size > 1 && !group.some((event: MrcmEvent) => event.conflict_tags.length > 0)) {
        errors.push(`${String(key)}: conflicting FACT_EVENT records without conflict_tags`);
      }
    }
  });

  return errors;
}
