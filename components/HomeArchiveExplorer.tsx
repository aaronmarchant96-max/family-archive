"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { AncestorCardProps } from "./AncestorCard";
import type { DocumentCardProps } from "./DocumentCard";
import { ConfidenceBadge } from "./ConfidenceBadge";
import { MemoryCard, type FamilyMemoryEntry } from "./MemoryCard";
import { RecordFrame } from "./RecordFrame";
import { SourcePreview } from "./SourcePreview";
import { ArchiveTimeline, type ArchiveEraJump, type ArchiveTimelineEvent, parseArchiveYear } from "./ArchiveTimeline";
import { FamilyWeb, type FamilyWebLane, type FamilyWebNode } from "./FamilyWeb";

type ArchiveHomeProps = {
  people: AncestorCardProps[];
  documents: DocumentCardProps[];
  familyMemory: FamilyMemoryEntry[];
  minYear: number;
  maxYear: number;
};

type FeaturedRecord = {
  id: string;
  title: string;
  kind: "document" | "memory";
  confidence: string;
  previewUrl?: string;
  sourceLabel: string;
  directStatement: string;
  supports: string;
  uncertain: string;
  evidence: string;
  narrative: string;
  linkHref?: string;
  people?: string[];
  place?: string;
};

type StrongRecord = {
  id: string;
  kind: "ancestor" | "document" | "memory";
  title: string;
  subtitle: string;
  confidence: string;
  summary: string;
  href: string;
  actionLabel: string;
  place?: string;
  year?: number;
  rankScore: number;
};

const eraJumps: ArchiveEraJump[] = [
  { label: "Revolutionary era", startYear: 1778, endYear: 1807 },
  { label: "Tennessee families", startYear: 1801, endYear: 1850 },
  { label: "Southern Iowa migration", startYear: 1850, endYear: 1875 },
  { label: "Oregon & Washington", startYear: 1860, endYear: 1930 },
  { label: "Ballymena / Moore", startYear: 1845, endYear: 1847 },
  { label: "Alberta / present", startYear: 1980, endYear: 2026 }
];

const chapters = [
  {
    label: "Roots & Revolution",
    range: "1675–1800",
    intro: "Early colonial roots in Virginia and Revolutionary War service that anchors the Ramsey and Dyer lines.",
    events: [] as any[] // populated from timelineEvents
  },
  {
    label: "Tennessee Families",
    range: "1801–1850",
    intro: "Hopkins, Clouse, and Ramsey families establish roots in Tennessee with land grants, marriages, and births.",
    events: [] as any[]
  },
  {
    label: "Southern Iowa Migration",
    range: "1851–1900",
    intro: "The great move west: Ramsey and Edwards families settle in Iowa, with census and draft records.",
    events: [] as any[]
  },
  {
    label: "Oregon & Washington",
    range: "1901–1950",
    intro: "Dyer and Edwards lines reach the Pacific Northwest. Military service, marriages, and household continuity.",
    events: [] as any[]
  },
  {
    label: "Ballymena & Moore",
    range: "1840s–1920s",
    intro: "The Irish Moore and Law connection through marriage records in Ballymena, linking to the main line.",
    events: [] as any[]
  },
  {
    label: "The Marchant Legacy",
    range: "1950–Present",
    intro: "Edith Ann Edwards and Hugh Moore's long life, the Red Book, and the living archive today.",
    events: [] as any[]
  }
];

type PlaceCard = {
  id: string;
  title: string;
  summary: string;
  accent: string;
  keywords: string[];
  jump: ArchiveEraJump;
  contextOnly?: boolean;
};

const placeCards: PlaceCard[] = [
  {
    id: "ballymena",
    title: "Ballymena, Northern Ireland",
    summary: "The Moore and Law marriage record anchors the Ballymena side of the archive.",
    accent: "Brass / paper",
    keywords: ["ballymena", "kirkinriola", "kilconriola", "county antrim", "springwell street", "bridge street"],
    jump: { label: "1846 marriage", startYear: 1845, endYear: 1847 }
  },
  {
    id: "tennessee",
    title: "Tennessee families",
    summary: "Claiborne, Hancock, Hawkins, and Washington County records track the Hopkins and Ramsey families.",
    accent: "Oxblood / slate",
    keywords: ["tennessee", "claiborne", "hancock", "hawkins", "washington county"],
    jump: { label: "1800-1850", startYear: 1800, endYear: 1850 }
  },
  {
    id: "southern-iowa",
    title: "Southern Iowa migration",
    summary: "Decatur, Richland, Bloomfield, and Long Creek records show the family’s Iowa settlement trail.",
    accent: "Paper / ink",
    keywords: ["iowa", "decatur", "richland", "long creek", "bloomfield", "davis county"],
    jump: { label: "1850-1900", startYear: 1850, endYear: 1900 }
  },
  {
    id: "oregon-washington",
    title: "Oregon and Washington years",
    summary: "The Dyer and Edwards records continue west into Oregon and Washington.",
    accent: "Brass / moss",
    keywords: ["oregon", "washington", "pine city", "whitman", "st john"],
    jump: { label: "1860-1930", startYear: 1860, endYear: 1930 }
  },
  {
    id: "alberta",
    title: "Alberta / present day",
    summary: "Archive workspace and modern family context. This card stays distinct from sourced history.",
    accent: "Slate / charcoal",
    keywords: ["alberta", "edmonton", "present day"],
    jump: { label: "1980-2026", startYear: 1980, endYear: 2026 },
    contextOnly: true
  }
] as const;

const memoryContextYears: Record<string, number> = {
  "kansas-city-story": 1900,
  "annes-book-notes": 2015,
  "red-book-personal-material": 1985
};

function matchesKeywords(text: string, keywords: string[]) {
  return keywords.some((keyword) => text.includes(keyword));
}

function personInRange(person: AncestorCardProps, startYear: number, endYear: number) {
  const years = (person.timeline ?? [])
    .map((entry) => parseArchiveYear(entry.date))
    .filter((year): year is number => year != null);

  if (years.length === 0) {
    const lifespanMatch = person.lifespan.match(/(\d{4})/g);
    return lifespanMatch ? lifespanMatch.some((year) => {
      const parsed = Number.parseInt(year, 10);
      return parsed >= startYear && parsed <= endYear;
    }) : true;
  }

  return years.some((year) => year >= startYear && year <= endYear);
}

function documentInRange(document: DocumentCardProps, startYear: number, endYear: number) {
  const year = parseArchiveYear(document.date);
  return year == null ? true : year >= startYear && year <= endYear;
}

function memoryInRange(entry: FamilyMemoryEntry, startYear: number, endYear: number) {
  const year = memoryContextYears[entry.id];
  return year >= startYear && year <= endYear;
}

function confidenceStyle(confidence: string) {
  if (confidence === "Primary Source" || confidence === "Confirmed") return "solid";
  if (confidence === "Strong Evidence") return "strong";
  if (confidence === "Family-Confirmed Oral History") return "oral";
  return "dotted";
}

function confidenceRank(confidence: string) {
  if (confidence === "Primary Source" || confidence === "Confirmed") return 5;
  if (confidence === "Strong Evidence") return 4;
  if (confidence === "Corroborated Compilation") return 3;
  if (confidence === "Family-Confirmed Oral History") return 2;
  if (confidence === "Needs Review" || confidence === "Needs Proof") return 1;
  return 0;
}

export function HomeArchiveExplorer({ people, documents, familyMemory, minYear, maxYear }: ArchiveHomeProps) {
  const [startYear, setStartYear] = useState(minYear);
  const [endYear, setEndYear] = useState(maxYear);
  const [viewMode, setViewMode] = useState<"timeline" | "web">("timeline");
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string>("thomas-ramsey-1799");
  const [activeChapter, setActiveChapter] = useState(0);
  const documentsById = useMemo(() => new Map(documents.map((document) => [document.id, document])), [documents]);
  const documentsByFilename = useMemo(
    () => new Map(documents.map((document) => [document.filename.toLowerCase(), document])),
    [documents]
  );

  const timelineEvents = useMemo(() => {
    const events: ArchiveTimelineEvent[] = [
      {
        id: "charles-dyer-discharge",
        title: "Charles Dyer discharge",
        dateLabel: "September 25, 1778",
        year: 1778,
        place: "Fort Randolph",
        confidence: "Primary Source",
        category: "record",
        summary: "The discharge states Charles Dyer was honorably discharged after service in the 12th Virginia Regiment.",
        supports: "Revolutionary War service and discharge at Fort Randolph.",
        linkedPeople: [{ name: "Charles Dyer", href: "/ancestors/charles-dyer" }],
        linkedDocuments: [{ label: "charles-dyer.pdf", href: "/documents/charles-dyer-discharge" }]
      },
      {
        id: "jabez-hopkins-marriage",
        title: "Jabez Hopkins marriage to Rachel Clouse",
        dateLabel: "1801",
        year: 1801,
        place: "Tennessee",
        confidence: "Strong Evidence",
        category: "person",
        summary: "Jabez Hopkins married Rachel Clouse, creating the Hopkins-Clouse line that leads to Anna Hopkins.",
        supports: "The Hopkins line behind Anna Hopkins Ramsey.",
        linkedPeople: [{ name: "Jabez Hopkins", href: "/ancestors/jabez-hopkins" }]
      },
      {
        id: "anna-hopkins-birth",
        title: "Anna Hopkins birth",
        dateLabel: "1807",
        year: 1807,
        place: "Tennessee",
        confidence: "Strong Evidence",
        category: "person",
        summary: "Anna Hopkins was born in Tennessee to Jabez Hopkins and Rachel Clouse.",
        supports: "Birth of the Anna Hopkins who later appears in the Ramsey household.",
        linkedPeople: [{ name: "Anna Hopkins Ramsey", href: "/ancestors/anna-hopkins-ramsey" }]
      },
      {
        id: "thomas-anna-marriage",
        title: "Thomas Ramsey × Anna Hopkins",
        dateLabel: "1824",
        year: 1824,
        place: "Hancock County, Tennessee",
        confidence: "Strong Evidence",
        category: "record",
        summary: "Thomas Ramsey and Anna Hopkins established the family line that moved into Iowa.",
        supports: "The Ramsey household that later appears in Iowa census records.",
        linkedPeople: [
          { name: "Thomas Ramsey", href: "/ancestors/thomas-ramsey-1799" },
          { name: "Anna Hopkins Ramsey", href: "/ancestors/anna-hopkins-ramsey" }
        ],
        linkedDocuments: [{ label: "Marriage record", href: "/documents/thomas-ramsey-anna-hopkins-marriage" }]
      },
      {
        id: "josiah-land-grant",
        title: "Josiah Ramsey land grant",
        dateLabel: "1827",
        year: 1827,
        place: "Claiborne County, Tennessee",
        confidence: "Primary Source",
        category: "record",
        summary: "The Tennessee grant places Josiah Ramsey in the Mulberry Creek area of Claiborne County.",
        supports: "A Tennessee land anchor for the working Josiah Ramsey profile.",
        linkedPeople: [{ name: "Josiah Ramsey", href: "/ancestors/josiah-ramsey-jr-1769" }],
        linkedDocuments: [{ label: "Tennessee land grant", href: "/documents/josiah-ramsey-tennessee-land-grant" }]
      },
      {
        id: "armina-birth",
        title: "Armina Ramsey birth",
        dateLabel: "26 August 1826",
        year: 1826,
        place: "Tennessee",
        confidence: "Confirmed",
        category: "person",
        summary: "Armina Ramsey was born to Thomas Ramsey and Anna Hopkins.",
        supports: "The direct Ramsey line that later appears in Iowa and Washington.",
        linkedPeople: [{ name: "Armina Ramsey", href: "/ancestors/armina-ramsey" }]
      },
      {
        id: "william-isabella-marriage",
        title: "William Moore × Isabella Law",
        dateLabel: "March 29, 1846",
        year: 1846,
        place: "Ballymena, County Antrim",
        confidence: "Primary Source",
        category: "record",
        summary: "The certificate names William Moore, Isabella Law, their addresses, occupations, and parents.",
        supports: "The Ballymena line that connects to the Moore / Law branch.",
        linkedPeople: [
          { name: "William Moore", href: "/ancestors/william-moore" },
          { name: "Isabella Law", href: "/ancestors/isabella-law" }
        ],
        linkedDocuments: [{ label: "real certifcate .pdf", href: "/documents/william-isabella-marriage-certificate" }]
      },
      {
        id: "decatur-township-1860",
        title: "Thomas Ramsey household",
        dateLabel: "1860",
        year: 1860,
        place: "Richland Township, Decatur County, Iowa",
        confidence: "Primary Source",
        category: "record",
        summary: "The census page places Thomas Ramsey, Anna Hopkins Ramsey, and the Ramsey household in southern Iowa.",
        supports: "The Iowa migration trail for the Ramsey and Hopkins lines.",
        linkedPeople: [
          { name: "Thomas Ramsey", href: "/ancestors/thomas-ramsey-1799" },
          { name: "Anna Hopkins Ramsey", href: "/ancestors/anna-hopkins-ramsey" },
          { name: "Armina Ramsey", href: "/ancestors/armina-ramsey" }
        ],
        linkedDocuments: [{ label: "census-decatur-township.pdf", href: "/documents/decatur-township-1860-census" }]
      },
      {
        id: "james-draft",
        title: "James Ramsey draft registration",
        dateLabel: "1863",
        year: 1863,
        place: "Long Creek, Decatur County, Iowa",
        confidence: "Primary Source",
        category: "record",
        summary: "The draft page shows James Ramsey, age 38, farmer, born in Tennessee, in Long Creek.",
        supports: "A dated Iowa record for the James Ramsey line.",
        linkedPeople: [{ name: "James Ramsey", href: "/ancestors/james-ramsey-1825" }],
        linkedDocuments: [{ label: "32178_1220705228_0032-00400.jpg", href: "/documents/james-ramsey-draft-registration" }]
      },
      {
        id: "george-dyer-service",
        title: "George Washington Dyer service",
        dateLabel: "1864",
        year: 1864,
        place: "Oregon",
        confidence: "Confirmed",
        category: "person",
        summary: "George Washington Dyer is recorded with the First Oregon Infantry during the Civil War.",
        supports: "The Oregon side of the Dyer line in the archive.",
        linkedPeople: [{ name: "George Washington Dyer", href: "/ancestors/george-washington-dyer" }],
        linkedDocuments: [{ label: "Dyer George W - Page 10.pdf", href: "/documents/george-washington-dyer-military-record" }]
      },
      {
        id: "armina-obituary",
        title: "Armina Ramsey Edwards obituary",
        dateLabel: "July 26, 1923",
        year: 1923,
        place: "Pine City, Washington",
        confidence: "Strong Evidence",
        category: "record",
        summary: "The obituary records Armina's birth, marriage, children, moves, and burial.",
        supports: "A later family record for the Ramsey / Edwards line.",
        linkedPeople: [
          { name: "Armina Ramsey", href: "/ancestors/armina-ramsey" },
          { name: "Anderson Edwards", href: "/ancestors/anderson-edwards" }
        ],
        linkedDocuments: [{ label: "obituary-armina-ramsey.pdf", href: "/documents/armina-ramsey-obituary" }]
      },
      {
        id: "josiah-plaque",
        title: "Ramsey memorial plaque",
        dateLabel: "1993",
        year: 1993,
        place: "Ramsey memorial site",
        confidence: "Strong Evidence",
        category: "milestone",
        summary: "The memorial plaque names Josiah Ramsey, Elizabeth Cowan, and their children, including Thomas Ramsey.",
        supports: "A memorial anchor for the older Ramsey line.",
        linkedDocuments: [{ label: "josiah-ramsey-family-plaque.jpg", href: "/documents/josiah-ramsey-family-plaque" }]
      },
      {
        id: "george-washington-dyer-1850-liberty-iowa-census",
        title: "George Washington Dyer 1850 Iowa residence",
        dateLabel: "1850",
        year: 1850,
        place: "Liberty, Jefferson County, Iowa",
        confidence: "Primary Source",
        category: "record",
        summary: "George Washington Dyer, age 15, residing in Liberty, Jefferson County, Iowa.",
        supports: "Confirms the early move from Illinois birth place to Iowa.",
        linkedPeople: [{ name: "George Washington Dyer", href: "/ancestors/george-washington-dyer" }],
        linkedDocuments: [{ label: "1850 census image", href: "/documents/george-washington-dyer-1850-liberty-iowa-census" }]
      },
      {
        id: "george-washington-dyer-1880-whitman-census",
        title: "George Washington Dyer 1880 Washington residence",
        dateLabel: "1880",
        year: 1880,
        place: "Whitman County, Washington",
        confidence: "Primary Source",
        category: "record",
        summary: "George Washington Dyer (age ~45), wife Elizabeth Ellen Conley, and family including daughter Nancy Ann Dyer.",
        supports: "Primary confirmation of the family in Whitman County after the Oregon years.",
        linkedPeople: [{ name: "George Washington Dyer", href: "/ancestors/george-washington-dyer" }, { name: "Elizabeth Ellen Conley", href: "/ancestors/elizabeth-ellen-conley" }, { name: "Nancy Ann Dyer", href: "/ancestors/nancy-ann-dyer" }],
        linkedDocuments: [{ label: "1880 census image", href: "/documents/george-washington-dyer-1880-whitman-census" }]
      },
      {
        id: "george-washington-dyer-1900-pine-city-census",
        title: "George Washington Dyer 1900 Pine City household",
        dateLabel: "1900",
        year: 1900,
        place: "Pine, Whitman County, Washington",
        confidence: "Primary Source",
        category: "record",
        summary: "George Washington Dyer (head, b. Nov 1835 Illinois, age 64, married 34 years) and household in Pine City precinct.",
        supports: "Detailed household and nativity confirmation matching the profile facts.",
        linkedPeople: [{ name: "George Washington Dyer", href: "/ancestors/george-washington-dyer" }, { name: "Elizabeth Ellen Conley", href: "/ancestors/elizabeth-ellen-conley" }],
        linkedDocuments: [{ label: "1900 census image", href: "/documents/george-washington-dyer-1900-pine-city-census" }]
      },
      {
        id: "memory-kansas-city",
        title: "Kansas City story",
        dateLabel: "Archive context: ~1900",
        year: memoryContextYears["kansas-city-story"],
        place: "Kansas City",
        confidence: "Family-Confirmed Oral History",
        category: "memory",
        summary: "Passed-down family recollection about the Marchant line.",
        supports: "Context for later family memory, not a primary source.",
        linkedDocuments: [{ label: "Oral history note", href: "/ancestors" }]
      },
      {
        id: "memory-annes-notes",
        title: "Anne's original letters",
        dateLabel: "Archive context: research years",
        year: memoryContextYears["annes-book-notes"],
        place: "Family archive",
        confidence: "Primary Source",
        category: "research",
        summary: "Original handwritten correspondence preserved with the Red Book material.",
        supports: "Source-grade letters that can be checked against the family timeline and the Red Book compilation.",
        linkedDocuments: [{ label: "Original correspondence", href: "/ancestors" }]
      },
      {
        id: "memory-red-book",
        title: "Anne's Red Book research compilation",
        dateLabel: "Archive context: later family compilation",
        year: memoryContextYears["red-book-personal-material"],
        place: "Family archive",
        confidence: "Confirmed",
        category: "research",
        summary: "A confirmed family research compilation built from correspondence, inherited material, and checked chronology.",
        supports: "The Red Book is corroborated family archive material rather than unsupported oral history.",
        linkedDocuments: [{ label: "Research archive note", href: "/ancestors" }]
      }
    ];

    return events.sort((a, b) => (a.year ?? Number.POSITIVE_INFINITY) - (b.year ?? Number.POSITIVE_INFINITY));
  }, []);

  const filteredTimelineEvents = useMemo(
    () => timelineEvents.filter((event) => event.year != null && event.year >= startYear && event.year <= endYear),
    [timelineEvents, startYear, endYear]
  );

  // Populate chapters dynamically from timeline data (simple year-based grouping)
  chapters[0].events = timelineEvents.filter((e: any) => e.year && e.year <= 1800).slice(0, 6);
  chapters[1].events = timelineEvents.filter((e: any) => e.year && e.year > 1800 && e.year <= 1850).slice(0, 6);
  chapters[2].events = timelineEvents.filter((e: any) => e.year && e.year > 1850 && e.year <= 1900).slice(0, 6);
  chapters[3].events = timelineEvents.filter((e: any) => e.year && e.year > 1900 && e.year <= 1950).slice(0, 6);
  chapters[4].events = timelineEvents.filter((e: any) => e.year && e.year >= 1840 && e.year <= 1925).slice(0, 5);
  chapters[5].events = timelineEvents.filter((e: any) => e.year && e.year >= 1950).slice(0, 5);

  useEffect(() => {
    if (!filteredTimelineEvents.length) {
      setSelectedEventId(null);
      return;
    }

    if (!selectedEventId || !filteredTimelineEvents.some((event) => event.id === selectedEventId)) {
      setSelectedEventId(filteredTimelineEvents[0].id);
    }
  }, [filteredTimelineEvents, selectedEventId]);

  const visiblePeople = useMemo(() => people.filter((person) => personInRange(person, startYear, endYear)), [people, startYear, endYear]);
  const visibleDocuments = useMemo(() => documents.filter((document) => documentInRange(document, startYear, endYear)), [documents, startYear, endYear]);
  const visibleMemory = useMemo(() => familyMemory.filter((entry) => memoryInRange(entry, startYear, endYear)), [familyMemory, startYear, endYear]);

  const strongestRecords = useMemo<StrongRecord[]>(
    () => {
      const peopleRecords = visiblePeople.map((person) => ({
        id: `person-${person.id}`,
        kind: "ancestor" as const,
        title: person.name,
        subtitle: person.branch,
        confidence: person.confidence,
        summary: person.summary,
        href: `/ancestors/${person.id}`,
        actionLabel: "Open profile",
        place: person.era,
        year: person.timeline?.map((entry) => parseArchiveYear(entry.date)).find((year): year is number => year != null) ?? parseArchiveYear(person.lifespan) ?? undefined,
        rankScore: confidenceRank(person.confidence) + (person.evidenceSummary?.length ? 0.25 : 0)
      }));

      const documentRecords = visibleDocuments.map((document) => ({
        id: `document-${document.id}`,
        kind: "document" as const,
        title: document.title || document.filename,
        subtitle: document.type,
        confidence: document.confidence,
        summary: document.fact || document.whatItProves || document.meaning || document.notes || document.sourceCitation || "Document record",
        href: `/documents/${document.id}`,
        actionLabel: "Open record",
        place: document.place,
        year: parseArchiveYear(document.date) ?? undefined,
        rankScore: confidenceRank(document.confidence) + (document.sourceUrl ? 0.25 : 0)
      }));

      const memoryRecords = visibleMemory.map((entry) => ({
        id: `memory-${entry.id}`,
        kind: "memory" as const,
        title: entry.title,
        subtitle: entry.categoryLabel ?? "Family memory",
        confidence: entry.confidence,
        summary: entry.description ?? entry.notes,
        href: "/ancestors",
        actionLabel: "See context",
        place: entry.era,
        year: memoryContextYears[entry.id],
        rankScore: confidenceRank(entry.confidence) - 0.5
      }));

      return [...peopleRecords, ...documentRecords, ...memoryRecords]
        .sort((a, b) => {
          if (b.rankScore !== a.rankScore) return b.rankScore - a.rankScore;
          const aYear = a.year ?? Number.POSITIVE_INFINITY;
          const bYear = b.year ?? Number.POSITIVE_INFINITY;
          if (aYear !== bYear) return aYear - bYear;
          return a.title.localeCompare(b.title);
        })
        .slice(0, 10);
    },
    [visibleDocuments, visibleMemory, visiblePeople]
  );

  const featuredRecordItems = useMemo<FeaturedRecord[]>(
    () => [
      {
        id: "charles-dyer-discharge",
        title: "Charles Dyer Revolutionary War discharge",
        kind: "document",
        confidence: "Primary Source",
        previewUrl: documentsById.get("charles-dyer-discharge")?.previewUrl,
        sourceLabel: "Revolutionary War discharge",
        directStatement: "The discharge names Charles Dyer, Captain William McKee's company, the 12th Virginia Regiment, and Fort Randolph.",
        supports: "Confirmed Revolutionary War service and the SAR proof chain.",
        uncertain: "The discharge itself does not prove every later-generation link.",
        evidence: "Primary discharge record and later affidavit trail.",
        narrative: "Use this record as the clean service anchor for the Dyer line. It is one of the strongest proof documents in the archive.",
        linkHref: "/documents/charles-dyer-discharge",
        people: ["Charles Dyer"],
        place: "Fort Randolph"
      },
      {
        id: "william-isabella-marriage-certificate",
        title: "William Moore and Isabella Law marriage record",
        kind: "document",
        confidence: "Primary Source",
        previewUrl: documentsById.get("william-isabella-marriage-certificate")?.previewUrl,
        sourceLabel: "Marriage certificate",
        directStatement: "The certificate records the Ballymena marriage of William Moore and Isabella Law and names their addresses, parents, and occupations.",
        supports: "The Moore / Law marriage line and Ballymena address trail.",
        uncertain: "It proves this marriage, not every later family relationship.",
        evidence: "Certified civil copy of the marriage entry.",
        narrative: "This is the most useful Ballymena anchor for the Moore and Law branch and should stay visually distinct from family lore.",
        linkHref: "/documents/william-isabella-marriage-certificate",
        people: ["William Moore", "Isabella Law"],
        place: "Ballymena, County Antrim"
      },
      {
        id: "armina-ramsey-obituary",
        title: "Armina Ramsey Edwards obituary",
        kind: "document",
        confidence: "Strong Evidence",
        previewUrl: documentsById.get("armina-ramsey-obituary")?.previewUrl,
        sourceLabel: "Obituary",
        directStatement: "The obituary states Armina Ramsey was born August 27, 1826, died July 10, 1923, married Anderson Edwards in 1840, and had eight children.",
        supports: "The Ramsey / Edwards migration trail into Iowa and Washington.",
        uncertain: "The obituary is derivative, so the marriage date still wants a primary register when available.",
        evidence: "Newspaper obituary transcription with family details.",
        narrative: "The obituary is valuable for family memory and place continuity, but it should not outrank civil records when the two disagree.",
        linkHref: "/documents/armina-ramsey-obituary",
        people: ["Armina Ramsey", "Anderson Edwards"],
        place: "Pine City, Washington"
      },
      {
        id: "decatur-township-1860-census",
        title: "Decatur County census page",
        kind: "document",
        confidence: "Primary Source",
        previewUrl: documentsById.get("decatur-township-1860-census")?.previewUrl,
        sourceLabel: "Census page",
        directStatement: "The page places Thomas Ramsey, Anna Hopkins Ramsey, and the Ramsey household in Richland Township, Decatur County, Iowa.",
        supports: "The southern Iowa household trail for the Ramsey and Hopkins family.",
        uncertain: "The census captures a household at a moment in time; it does not on its own prove every later descendant.",
        evidence: "Federal census schedule and source citation.",
        narrative: "This is the key household record that ties the Tennessee families to the Iowa settlement trail.",
        linkHref: "/documents/decatur-township-1860-census",
        people: ["Thomas Ramsey", "Anna Hopkins Ramsey", "Armina Ramsey", "Anderson Edwards"],
        place: "Richland Township, Decatur County, Iowa"
      },
      {
        id: "annes-book-notes",
        title: "Anne's family research notes",
        kind: "memory",
        confidence: "Strong Evidence",
        sourceLabel: "Family research note",
        directStatement: "Anne's notes organize the Edwards, Moore, Marchant, and Ramsey material into a working proof path.",
        supports: "A research map, not a standalone civil record.",
        uncertain: "Useful for direction, but each claim still needs a primary scan or register entry.",
        evidence: "Family notebook material and research organization.",
        narrative: "This belongs in the archive because it guides the record hunt, but it must remain separate from source-grade evidence.",
        people: ["Edwards", "Moore", "Marchant"],
        place: "Family archive"
      }
    ],
    [documentsById]
  );

  const [featuredRecordIndex, setFeaturedRecordIndex] = useState(0);
  const featuredRecord = featuredRecordItems[featuredRecordIndex] ?? featuredRecordItems[0];

  const familyWebLanes = useMemo<FamilyWebLane[]>(
    () => [
      {
        title: "Confirmed connections",
        subtitle: "This line is already tied together by marriage returns, census entries, and the Red Book trail.",
        laneStyle: "documented",
        nodes: [
          {
            id: "silas-josiah-edwards",
            label: "Silas Josiah Edwards",
            subtitle: "documented profile",
            confidence: "Primary Source",
            note: "Marriage return, census records, and obituary context line up on this profile.",
            href: "/ancestors/silas-josiah-edwards"
          },
          {
            id: "nancy-ann-dyer",
            label: "Nancy Ann Dyer",
            subtitle: "documented profile",
            confidence: "Strong Evidence",
            note: "Anchored by the marriage and household records in Washington.",
            href: "/ancestors/nancy-ann-dyer"
          },
          {
            id: "edith-ann-edwards",
            label: "Edith Ann Edwards Moore",
            subtitle: "documented profile",
            confidence: "Primary Source",
            note: "Marriage record and later family material place Edith as a confirmed Moore branch anchor.",
            href: "/ancestors/edith-ann-edwards"
          },
          {
            id: "hugh-christopher-moore",
            label: "Hugh Christopher Moore",
            subtitle: "documented profile",
            confidence: "Primary Source",
            note: "His marriage to Edith and later records connect the Canadian and Washington branches.",
            href: "/ancestors/hugh-christopher-moore"
          }
        ]
      },
      {
        title: "Documented line",
        subtitle: "Loaded profiles and records already present in the archive. Dotted items are still treated carefully.",
        laneStyle: "documented",
        nodes: [
          {
            id: "aaron-marchant",
            label: "Aaron Marchant",
            subtitle: "loaded profile",
            confidence: "Strong Evidence",
            note: "AI evaluator and builder in Calgary, son of Brett and Christine, grandson of David and Nancy, brother of Shawn.",
            href: "/ancestors/aaron-marchant"
          },
          {
            id: "shawn-marchant",
            label: "Shawn Marchant",
            subtitle: "loaded profile",
            confidence: "Strong Evidence",
            note: "Son of Brett and Christine, grandson of David and Nancy, brother of Aaron.",
            href: "/ancestors/shawn-marchant"
          },
          {
            id: "brett-marchant",
            label: "Brett Marchant",
            subtitle: "loaded profile",
            confidence: "Strong Evidence",
            note: "Son of David and Nancy Marchant, husband of Christine, and father of Aaron and Shawn.",
            href: "/ancestors/brett-marchant"
          },
          {
            id: "colleen-gay-lattin",
            label: "Colleen Gay Lattin",
            subtitle: "loaded profile",
            confidence: "Strong Evidence",
            note: "Daughter of David and Nancy, worked at Telus, Olympic volunteer.",
            href: "/ancestors/colleen-gay-lattin"
          },
          {
            id: "nancy-moore-marchant",
            label: "Nancy Moore Marchant",
            subtitle: "loaded profile",
            confidence: "Strong Evidence",
            note: "Mother of Brett and Colleen, grandmother of Aaron and Shawn, and bridge from Moore into the Marchant family.",
            href: "/ancestors/nancy-moore-marchant"
          },
          {
            id: "david-marchant",
            label: "David Marchant",
            subtitle: "loaded profile",
            confidence: "Strong Evidence",
            note: "Calgary draughtsman, husband of Nancy Carol Moore, and grandfather of Aaron and Shawn.",
            href: "/ancestors/david-marchant"
          },
          {
            id: "george-washington-dyer",
            label: "George Washington Dyer",
            subtitle: "loaded profile",
            confidence: "Confirmed",
            note: "Civil War-era Oregon service record is already attached.",
            href: "/ancestors/george-washington-dyer"
          },
          {
            id: "jonathan-dyer",
            label: "Jonathan Dyer",
            subtitle: "loaded profile",
            confidence: "Strong Evidence",
            note: "Named in the Charles Dyer pension affidavit and the descent chain.",
            href: "/ancestors/jonathan-dyer"
          },
          {
            id: "charles-dyer",
            label: "Charles Dyer",
            subtitle: "loaded profile",
            confidence: "Confirmed",
            note: "The Revolutionary War discharge record remains the key anchor.",
            href: "/ancestors/charles-dyer"
          },
          {
            id: "armina-ramsey",
            label: "Armina Ramsey",
            subtitle: "loaded profile",
            confidence: "Confirmed",
            note: "The obituary, census trail, and parentage notes keep her central.",
            href: "/ancestors/armina-ramsey"
          },
          {
            id: "anderson-edwards",
            label: "Anderson Edwards",
            subtitle: "loaded profile",
            confidence: "Strong Evidence",
            note: "Marriage date still needs verification, but the family link stands.",
            href: "/ancestors/anderson-edwards"
          },
          {
            id: "thomas-ramsey-1799",
            label: "Thomas Ramsey × Anna Hopkins",
            subtitle: "loaded profile",
            confidence: "Primary Source",
            note: "The Iowa census and Ramsey family records support the household line.",
            href: "/ancestors/thomas-ramsey-1799"
          },
          {
            id: "jabez-hopkins",
            label: "Jabez Hopkins × Rachel Clouse",
            subtitle: "loaded profile",
            confidence: "Strong Evidence",
            note: "The Tennessee-to-Iowa trail runs through this Hopkins line.",
            href: "/ancestors/jabez-hopkins"
          },
          {
            id: "william-moore",
            label: "William Moore × Isabella Law",
            subtitle: "loaded profile",
            confidence: "Confirmed",
            note: "The Ballymena marriage record is already in the archive.",
            href: "/ancestors/william-moore"
          },
          {
            id: "james-moore-1860",
            label: "James Moore × Jessie Bowen",
            subtitle: "loaded profile",
            confidence: "Strong Evidence",
            note: "Bridges the Irish branch to the Canadian prairies.",
            href: "/ancestors/james-moore-1860"
          },
          {
            id: "simon-moore",
            label: "Simon Moore",
            subtitle: "loaded profile",
            confidence: "Needs Review",
            note: "Schoolmaster in Ballymena, father of William.",
            href: "/ancestors/simon-moore"
          },
          {
            id: "patrick-law-ballymena",
            label: "Patrick Law",
            subtitle: "loaded profile",
            confidence: "Needs Review",
            note: "Brass founder in Ballymena, father of Isabella.",
            href: "/ancestors/patrick-law-ballymena"
          }
        ]
      }
    ],
    []
  );

  const selectedWebNode = familyWebLanes.flatMap((lane) => lane.nodes).find((node) => node.id === selectedNodeId) ?? familyWebLanes.flatMap((lane) => lane.nodes)[0] ?? null;
  const georgeWashingtonDyer = people.find((person) => person.id === "george-washington-dyer");
  const jonathanDyer = people.find((person) => person.id === "jonathan-dyer");

  const heroPortrait = georgeWashingtonDyer?.portraitUrl ?? "/portraits/george-washington-dyer.png";
  const heroPortraitCaption = georgeWashingtonDyer?.portraitCaption ?? "Descendant-shared family portrait of George Washington Dyer.";
  const featuredPortrait2 = jonathanDyer?.portraitUrl ?? "/portraits/jonathan-dyer-feature.jpg";
  const featuredPortrait2Name = jonathanDyer?.name ?? "Jonathan Dyer";
  const featuredPortrait2Caption = jonathanDyer?.portraitCaption ?? "Son of Charles Dyer (Revolutionary War veteran); father of George Washington Dyer.";
  const secondaryPreview = documentsById.get("george-washington-dyer-1880-whitman-census")?.previewUrl;
  const tertiaryPreview = documentsById.get("george-washington-dyer-1900-pine-city-census")?.previewUrl;
  const fourthPreview = documentsById.get("charles-dyer-discharge")?.previewUrl ?? "/documents/charles-dyer.pdf";
  const heroProofTrail = [
    { label: "George Washington Dyer", detail: "1880 Whitman County census" },
    { label: "Silas Josiah Edwards", detail: "Pine City marriage return" },
    { label: "Edith Ann Edwards Moore", detail: "1924 Colfax marriage" }
  ];

  return (
    <div className="space-y-10">
      <section className="archive-home-hero">
        <div className="archive-home-hero__copy">
          <div className="archive-home-hero__ribbon">Front page / proof-first archive / verified family line</div>
          <div className="archive-eyebrow">Our family’s records</div>
          <h1 className="archive-display text-5xl font-semibold tracking-tight text-[var(--archive-ink)] sm:text-6xl">
            The Living Red Book
          </h1>
          <p className="max-w-2xl text-base leading-7 text-[rgba(244,239,231,0.8)] sm:text-lg">
            A collection of real family documents, letters, and stories from the people who came before us.
          </p>
          <div className="flex flex-wrap gap-2 pt-2">
            <span className="archive-pill">Private family use</span>
            <span className="archive-pill">Built from old records</span>
            <span className="archive-pill">Facts kept separate from stories</span>
            <span className="archive-pill">Still being added to</span>
          </div>
          <div className="archive-stat-grid pt-2">
            <Stat value={people.length} label="People we know about" />
            <Stat value={documents.length} label="Original documents" />
            <Stat value={familyMemory.length} label="Family stories & notes" />
          </div>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link href="#timeline" className="archive-hero-button">
              See the timeline
            </Link>
            <Link href="#featured-record" className="archive-hero-button archive-hero-button--ghost">
              A record worth noting
            </Link>
            <Link href="#places" className="archive-hero-button archive-hero-button--ghost">
              Look by place
            </Link>
          </div>
          <div className="archive-home-hero__signal">
            <div className="archive-home-hero__signal-label">What the front page is doing</div>
            <div className="archive-home-hero__signal-copy">
              It opens on George Washington Dyer, then follows the line through the records that actually prove the
              connection, instead of burying the page in cards.
            </div>
          </div>
        </div>

        <div className="archive-home-hero__wall">
          <div className="archive-home-hero__proof-chain">
            <div className="archive-home-hero__proof-chain-label">Proof trail</div>
            <div className="archive-home-hero__proof-chain-track">
              {heroProofTrail.map((step, index) => (
                <div key={step.label} className="archive-home-hero__proof-step">
                  <div className="archive-home-hero__proof-step-label">{step.label}</div>
                  <div className="archive-home-hero__proof-step-detail">{step.detail}</div>
                  {index < heroProofTrail.length - 1 ? <div className="archive-home-hero__proof-step-arrow">→</div> : null}
                </div>
              ))}
            </div>
          </div>
          <div className="flex gap-4">
            <div className="archive-home-hero__portrait-frame flex-1">
              <SourcePreview src={heroPortrait} title="George Washington Dyer" className="archive-home-hero__portrait" />
              <div className="archive-home-hero__portrait-meta">
                <div>
                  <div className="archive-kicker">Front-door family anchor</div>
                  <div className="archive-home-hero__portrait-name">George Washington Dyer</div>
                </div>
                <div className="archive-home-hero__portrait-note">{heroPortraitCaption}</div>
              </div>
            </div>
            <div className="archive-home-hero__portrait-frame flex-1">
              <SourcePreview src={featuredPortrait2} title={featuredPortrait2Name} className="archive-home-hero__portrait" />
              <div className="archive-home-hero__portrait-meta">
                <div>
                  <div className="archive-kicker">Descendant legacy</div>
                  <div className="archive-home-hero__portrait-name">{featuredPortrait2Name}</div>
                </div>
                <div className="archive-home-hero__portrait-note">{featuredPortrait2Caption}</div>
              </div>
            </div>
          </div>
          <div className="archive-home-hero__evidence-grid">
            <RecordTile src={secondaryPreview} title="1880 Whitman County census" caption="George, Ellen, and Nancy Ann Dyer" />
            <RecordTile src={tertiaryPreview} title="1900 Pine City household" caption="Later Dyer household continuity" />
            <RecordTile src={fourthPreview} title="Charles Dyer discharge" caption="Revolutionary line anchor" />
          </div>
          <div className="mt-4 rounded-[1.5rem] border border-[rgba(244,239,231,0.12)] bg-[rgba(244,239,231,0.04)] p-4 text-sm leading-6 text-[rgba(244,239,231,0.76)]">
            George Washington Dyer and Jonathan Dyer lead the front page, with the Dyer household records and the earlier Charles Dyer discharge kept close by as the proof trail behind their portraits.
          </div>
        </div>
      </section>

      <section id="timeline" className="space-y-6">
        <div className="archive-panel flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-2">
            <div className="archive-kicker">The main part of the site</div>
            <h2 className="archive-section__title text-3xl">Family events over time</h2>
            <p className="max-w-3xl text-sm leading-6 text-[var(--archive-text-soft)]">
              Drag the sliders to focus on certain years. Solid markers mean we have original documents. Dotted ones
              are from family stories or less certain information.
            </p>
          </div>
          <div className="flex rounded-full border border-[rgba(18,20,24,0.1)] bg-[rgba(18,20,24,0.03)] p-1">
            <button
              type="button"
              onClick={() => setViewMode("timeline")}
              className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition ${
                viewMode === "timeline"
                  ? "bg-[rgba(139,31,43,0.9)] text-white"
                  : "text-[var(--archive-text-soft)] hover:text-[var(--archive-text)]"
              }`}
            >
              See the timeline
            </button>
            <button
              type="button"
              onClick={() => setViewMode("web")}
              className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition ${
                viewMode === "web"
                  ? "bg-[rgba(139,31,43,0.9)] text-white"
                  : "text-[var(--archive-text-soft)] hover:text-[var(--archive-text)]"
              }`}
            >
              See family connections
            </button>
          </div>
        </div>

        {viewMode === "timeline" ? (
          <div className="space-y-4">
            {/* Red Book Chapters tabs */}
            <div className="flex flex-wrap gap-1 border-b border-[rgba(18,20,24,0.1)] pb-2 overflow-x-auto">
              {chapters.map((chapter, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setActiveChapter(index)}
                  className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] border-b-2 transition whitespace-nowrap min-h-[36px] ${
                    activeChapter === index
                      ? "border-[var(--archive-accent)] text-[var(--archive-text)] bg-[rgba(139,31,43,0.05)]"
                      : "border-transparent text-[var(--archive-text-soft)] hover:text-[var(--archive-text)] hover:border-[rgba(139,31,43,0.2)]"
                  }`}
                >
                  {chapter.label}
                </button>
              ))}
            </div>

            {/* Active chapter panel with visual thread */}
            <div className="archive-panel space-y-4">
              <div>
                <div className="flex items-baseline gap-2">
                   <div>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--archive-accent)]">{chapters[activeChapter].range}</div>
                    <h3 className="text-2xl font-semibold tracking-tight archive-display">{chapters[activeChapter].label}</h3>
                  </div>
                </div>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--archive-text-soft)]">{chapters[activeChapter].intro}</p>
              </div>

              <div className="relative pl-6 border-l-2 border-[rgba(139,31,43,0.15)] space-y-3">
                {chapters[activeChapter].events.map((event: any, idx: number) => {
                  const certainty = event.certainty ?? confidenceStyle(event.confidence);
                  return (
                    <div key={idx} className="relative">
                      <div className="absolute -left-[7px] top-1.5 h-2.5 w-2.5 rounded-full border border-[var(--archive-accent)] bg-white" />
                      <div className={`rounded-xl border p-3 text-sm transition min-h-[90px] ${
                        certainty === "solid" ? "border-[rgba(233,217,205,0.24)] bg-[rgba(244,239,231,0.94)] text-[var(--archive-text)]" :
                        certainty === "strong" ? "border-[rgba(160,123,70,0.28)] bg-[rgba(237,229,217,0.95)] text-[var(--archive-text)]" :
                        "border border-dashed border-[rgba(139,31,43,0.38)] bg-[rgba(139,31,43,0.1)] text-[rgba(244,239,231,0.94)]"
                      }`}>
                        <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.24em] opacity-70">
                          <span>{event.dateLabel}</span>
                          <span>{event.category}</span>
                        </div>
                        <div className="mt-1 font-semibold leading-tight archive-display line-clamp-1">{event.title}</div>
                        {event.place && <div className="mt-0.5 text-xs opacity-70 line-clamp-1">{event.place}</div>}
                        <div className="mt-1.5 text-xs leading-5 line-clamp-2 opacity-90">{event.summary}</div>
                        <div className="mt-2">
                          <ConfidenceBadge label={event.confidence} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
            <FamilyWeb
              lanes={familyWebLanes}
              selectedNodeId={selectedNodeId}
              onSelectNode={(node) => setSelectedNodeId(node.id)}
            />
            <div className="archive-panel space-y-4">
              <div className="archive-section__title">Web detail</div>
              <p className="text-sm leading-6 text-[var(--archive-text-soft)]">
                The family web keeps the direct path visible and puts confirmed profiles first.
              </p>
              {selectedWebNode ? (
                <div className="space-y-4 rounded-[1.5rem] border border-[rgba(18,20,24,0.08)] bg-[rgba(18,20,24,0.03)] p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="archive-eyebrow">{selectedWebNode.bridge ? "Research bridge" : "Loaded profile"}</div>
                      <h3 className="mt-1 text-2xl font-semibold tracking-tight text-[var(--archive-text)] archive-display">
                        {selectedWebNode.label}
                      </h3>
                    </div>
                    <ConfidenceBadge label={selectedWebNode.confidence} />
                  </div>
                  <div className="text-sm leading-6 text-[var(--archive-text-soft)]">{selectedWebNode.subtitle}</div>
                  <div className="rounded-2xl border border-[rgba(18,20,24,0.08)] bg-[rgba(18,20,24,0.03)] p-4 text-sm leading-6 text-[var(--archive-text)]">
                    {selectedWebNode.note}
                  </div>
                  {selectedWebNode.href ? (
                    <Link className="archive-nav__link inline-flex w-fit" href={selectedWebNode.href}>
                      Open profile
                    </Link>
                  ) : null}
                </div>
              ) : null}
            </div>
          </section>
        )}
      </section>

      <section id="featured-record" className="space-y-4">
        <div className="archive-section__head">
          <div>
            <div className="archive-section__title">A record worth noting</div>
            <div className="archive-section__copy">
              One record at a time. The scan is prominent, and the explanation keeps direct statement, support, and
              uncertainty separate.
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {featuredRecordItems.map((item, index) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFeaturedRecordIndex(index)}
              className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition ${
                featuredRecordIndex === index
                  ? "border-[rgba(139,31,43,0.35)] bg-[rgba(139,31,43,0.12)] text-[var(--archive-accent)]"
                  : "border-[rgba(18,20,24,0.08)] bg-white/55 text-[var(--archive-text)] hover:bg-white"
              }`}
            >
              {item.title}
            </button>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <div className="archive-panel space-y-4">
            <div className="overflow-hidden rounded-[1.4rem] border border-[rgba(18,20,24,0.08)] bg-[rgba(18,20,24,0.03)]">
              {featuredRecord.previewUrl ? (
                <SourcePreview src={featuredRecord.previewUrl} title={featuredRecord.title} className="h-[32rem] w-full" />
              ) : (
                <div className="flex h-[32rem] items-center justify-center bg-[rgba(18,20,24,0.04)] p-8 text-center text-sm leading-6 text-[var(--archive-text-soft)]">
                  {featuredRecord.directStatement}
                </div>
              )}
            </div>
            <div className="text-xs uppercase tracking-[0.22em] text-[var(--archive-text-soft)]">
              {featuredRecord.sourceLabel}
            </div>
          </div>
          <RecordFrame
            evidence={featuredRecord.evidence}
            claim={featuredRecord.directStatement}
            confidence={featuredRecord.confidence}
            narrative={`${featuredRecord.supports} ${featuredRecord.uncertain ? ` ${featuredRecord.uncertain}` : ""}`.trim()}
          />
        </div>
      </section>

      <section id="places" className="space-y-4">
        <div className="archive-section__head">
          <div>
            <div className="archive-section__title">Look by place</div>
            <div className="archive-section__copy">
              Click a place to jump into the matching Red Book chapter. These cards highlight the migration trails and record clusters tied to each region.
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {placeCards.map((place) => {
  const evidenceCount = countMatches(place.keywords, visiblePeople, visibleDocuments, visibleMemory, timelineEvents);

            return (
              <button
                key={place.id}
                type="button"
                onClick={() => {
                  setViewMode("timeline");
                  const chapterIndex = place.id.includes("tennessee") ? 1 : place.id.includes("iowa") ? 2 : (place.id.includes("oregon") || place.id.includes("washington")) ? 3 : 0;
                  setActiveChapter(chapterIndex);
                }}
                className="group text-left"
              >
                <div className="archive-place-card h-full">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="archive-eyebrow">{place.contextOnly ? "Archive context" : "Place"} </div>
                      <h3 className="mt-1 text-2xl font-semibold tracking-tight text-[var(--archive-text)] archive-display">
                        {place.title}
                      </h3>
                    </div>
                    <div className="rounded-full border border-[rgba(139,31,43,0.2)] bg-[rgba(139,31,43,0.08)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--archive-accent)]">
                      {evidenceCount} items
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-[var(--archive-text-soft)]">{place.summary}</p>
                   <div className="mt-4 flex items-center justify-between gap-3">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--archive-accent-soft)]">
                      {place.accent}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section className="archive-section">
        <div className="archive-section__head">
          <div>
            <div className="archive-section__title">Top ten strongest records</div>
            <div className="archive-section__copy">
              A shorter front-page list. These are the most reliable people, records, and archive notes in the
              current year window.
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link className="archive-nav__link inline-flex" href="/ancestors">
              Browse people
            </Link>
            <Link className="archive-nav__link inline-flex" href="/documents">
              Browse records
            </Link>
          </div>
        </div>
        {strongestRecords.length ? (
          <div className="grid gap-3 lg:grid-cols-2">
            {strongestRecords.map((record, index) => (
              <article
                key={record.id}
                className="rounded-[1.5rem] border border-[rgba(18,20,24,0.08)] bg-[rgba(244,239,231,0.96)] p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-[rgba(127,29,45,0.25)] hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--archive-accent-soft)]">
                      #{index + 1} {record.kind}
                    </div>
                    <h3 className="mt-1 text-xl font-semibold tracking-tight text-[var(--archive-text)] archive-display">
                      {record.title}
                    </h3>
                  </div>
                  <ConfidenceBadge label={record.confidence} />
                </div>
                <div className="mt-2 text-sm font-medium text-[var(--archive-text-soft)]">{record.subtitle}</div>
                <div className="mt-1 text-sm text-[var(--archive-text-soft)]">
                  {record.year ? `${record.year} • ` : ""}
                  {record.place ?? "Archive item"}
                </div>
                <p className="mt-3 line-clamp-3 text-sm leading-6 text-[var(--archive-text)]">{record.summary}</p>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <Link
                    href={record.href}
                    className="rounded-full border border-[rgba(18,20,24,0.08)] bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--archive-text)] hover:border-[rgba(127,29,45,0.35)] hover:bg-white"
                  >
                    {record.actionLabel}
                  </Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="archive-empty">No strong records fall inside the current year range.</div>
        )}
      </section>

      <section className="archive-section">
        <div className="archive-section__head">
          <div>
            <div className="archive-section__title">Family Memory / Research Archive</div>
            <div className="archive-section__copy">
              Oral history stays separate. The full archive pages hold the long-form material; the homepage keeps
              only the strongest shortlist and the visual entry points.
            </div>
          </div>
          <Link className="archive-nav__link inline-flex" href="#timeline">
            Back to timeline
          </Link>
        </div>
        {visibleMemory.length ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {visibleMemory.slice(0, 3).map((entry) => (
              <MemoryCard key={entry.id} {...entry} />
            ))}
          </div>
        ) : (
          <div className="archive-empty">
            No family memory entries fit the current context window. Jump to the later archive years to bring them
            back into view.
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="archive-home-stat">
      <div className="archive-home-stat__value">{value}</div>
      <div className="archive-home-stat__label">{label}</div>
    </div>
  );
}

function RecordTile({ src, title, caption }: { src?: string; title: string; caption: string }) {
  return (
    <div className="overflow-hidden rounded-[1.4rem] border border-[rgba(244,239,231,0.12)] bg-[rgba(244,239,231,0.04)]">
      <SourcePreview src={src} title={title} className="h-40 w-full" />
      <div className="border-t border-[rgba(244,239,231,0.08)] p-3">
        <div className="text-sm font-semibold text-[rgba(244,239,231,0.9)] archive-display">{title}</div>
        <div className="mt-1 text-xs leading-5 text-[rgba(244,239,231,0.66)]">{caption}</div>
      </div>
    </div>
  );
}

function countMatches(
  keywords: readonly string[],
  people: AncestorCardProps[],
  documents: DocumentCardProps[],
  memory: FamilyMemoryEntry[],
  events: ArchiveTimelineEvent[]
) {
  const tokens = keywords.map((keyword) => keyword.toLowerCase());

  const peopleMatches = people.filter((person) => {
    const haystack = [
      person.name,
      person.branch,
      person.era,
      person.summary,
      person.keyEvent,
      person.sourceCitation,
      person.attachedDocument,
      ...(person.tags ?? []),
      ...(person.timeline ?? []).flatMap((entry) => [entry.title, entry.date, entry.place, entry.summary, entry.confidence]),
      ...(person.evidenceSummary ?? [])
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return matchesKeywords(haystack, tokens);
  }).length;

  const docMatches = documents.filter((document) => {
    const haystack = [
      document.filename,
      document.type,
      document.date,
      document.place,
      document.whatItProves,
      document.notes,
      document.sourceCitation,
      document.sourceUrl,
      ...(document.people ?? [])
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return matchesKeywords(haystack, tokens);
  }).length;

  const memoryMatches = memory.filter((entry) => {
    const haystack = [
      entry.title,
      entry.sharedBy,
      entry.era,
      entry.mode,
      entry.notes,
      ...(entry.relatedPeople ?? []),
      ...(entry.relatedPlaces ?? [])
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return matchesKeywords(haystack, tokens);
  }).length;

  const eventMatches = events.filter((event) => {
    const haystack = [
      event.title,
      event.dateLabel,
      event.place,
      event.summary,
      event.supports,
      event.confidence,
      ...(event.linkedPeople ?? []).map((item) => item.name),
      ...(event.linkedDocuments ?? []).map((item) => item.label)
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return matchesKeywords(haystack, tokens);
  }).length;

  return peopleMatches + docMatches + memoryMatches + eventMatches;
}
