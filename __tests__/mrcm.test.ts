import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { AncestorsBrowser } from "../components/AncestorsBrowser";
import { AncestorsTimeline } from "../components/AncestorsTimeline";
import {
  buildCanonicalKey,
  canonicalEventIdFromKey,
  eventsForPeople,
  fullEvents,
  validateEventRecords,
} from "../lib/mrcm";
import peopleData from "../data/people.json";

const people = peopleData as Array<{ id: string; name: string; confidence: string; branch: string; lifespan: string; summary: string; keyEvent: string; timeline?: Array<{ title: string; date: string; summary: string; confidence: string; place?: string }> }>;

describe("MRCM timeline hardening", () => {
  test("canonical key generation is deterministic", () => {
    const keyA = buildCanonicalKey("person-1", "Marriage", "1846-03-29", "Ballymena, County Antrim");
    const keyB = buildCanonicalKey("person-1", "Marriage", "1846-03-29", "Ballymena, County Antrim");

    expect(keyA).toBe(keyB);
    expect(canonicalEventIdFromKey(keyA)).toBe(canonicalEventIdFromKey(keyB));
  });

  test("generated timeline artifacts validate cleanly", () => {
    expect(validateEventRecords(fullEvents)).toEqual([]);
  });

  test("validation catches missing event classes, invalid tiers, and bad duplicate references", () => {
    const [sample] = fullEvents;
    const invalid = [
      {
        ...sample,
        event_id: "bad-event",
        canonical_event_id: "canonical-bad-event",
        event_class: "" as any,
        confidence_tier: "INVALID" as any,
        duplicate_of: "missing-canonical-id",
        canonical_key: "bad|key",
      },
    ];

    const errors = validateEventRecords(invalid as any);
    expect(errors.some((entry) => entry.includes("invalid event_class"))).toBe(true);
    expect(errors.some((entry) => entry.includes("invalid confidence_tier"))).toBe(true);
    expect(errors.some((entry) => entry.includes("invalid duplicate_of reference"))).toBe(true);
  });

  test("canonical filtering suppresses relational echoes unless enabled", () => {
    const ids = new Set(["george-washington-dyer", "elizabeth-ellen-conley"]);
    const canonicalOnly = eventsForPeople(ids, fullEvents, {
      canonicalOnly: true,
      includeRelationalEchoes: false,
      needsReviewOnly: false,
      conflictOnly: false,
      queueOnly: false,
    });
    const relationalEchoes = eventsForPeople(ids, fullEvents, {
      canonicalOnly: false,
      includeRelationalEchoes: true,
      needsReviewOnly: false,
      conflictOnly: false,
      queueOnly: false,
    });

    expect(relationalEchoes.length).toBeGreaterThanOrEqual(canonicalOnly.length);
    expect(relationalEchoes.some((event) => event.event_class === "RELATION_EVENT")).toBe(true);
  });

  test("needs review filter returns only review-tier events", () => {
    const ids = new Set(people.slice(0, 40).map((person) => person.id));
    const events = eventsForPeople(ids, fullEvents, {
      canonicalOnly: false,
      includeRelationalEchoes: true,
      needsReviewOnly: true,
      conflictOnly: false,
      queueOnly: false,
    });

    expect(events.length).toBeGreaterThan(0);
    expect(events.every((event) => event.confidence_tier === "NEEDS_REVIEW")).toBe(true);
  });

  test("ancestors browser defaults to cards mode", () => {
    const markup = renderToStaticMarkup(React.createElement(AncestorsBrowser, { people: people.slice(0, 3) as any }));

    expect(markup).toContain("Cards");
    expect(markup).toContain("Research Queue");
    expect(markup).not.toContain("Chronological view");
  });

  test("timeline panel defaults to canonical mode", () => {
    const markup = renderToStaticMarkup(
      React.createElement(AncestorsTimeline, {
        people: people.slice(0, 3) as any,
        queueOnly: false,
        onClearQueue: () => undefined,
      })
    );

    expect(markup).toContain("Canonical events only");
    expect(markup).toContain('aria-pressed="true"');
    expect(markup).toContain("Include relational echoes");
  });
});
