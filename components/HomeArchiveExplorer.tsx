"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AncestorCard, type AncestorCardProps } from "./AncestorCard";
import { DocumentCard, type DocumentCardProps } from "./DocumentCard";
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

const eraJumps: ArchiveEraJump[] = [
  { label: "Revolutionary era", startYear: 1778, endYear: 1807 },
  { label: "Tennessee families", startYear: 1801, endYear: 1850 },
  { label: "Southern Iowa migration", startYear: 1850, endYear: 1875 },
  { label: "Oregon & Washington", startYear: 1860, endYear: 1930 },
  { label: "Ballymena / Moore", startYear: 1845, endYear: 1847 },
  { label: "Alberta / present", startYear: 1980, endYear: 2026 }
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

export function HomeArchiveExplorer({ people, documents, familyMemory, minYear, maxYear }: ArchiveHomeProps) {
  const [startYear, setStartYear] = useState(minYear);
  const [endYear, setEndYear] = useState(maxYear);
  const [viewMode, setViewMode] = useState<"timeline" | "web">("timeline");
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string>("thomas-ramsey-1799");
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
        id: "memory-kansas-city",
        title: "Kansas City story",
        dateLabel: "Archive context: ~1900",
        year: memoryContextYears["kansas-city-story"],
        place: "Kansas City",
        confidence: "Family-Confirmed Oral History",
        category: "memory",
        summary: "Passed-down family recollection about the Marchant line.",
        supports: "Context for later family memory, not a primary source.",
        linkedDocuments: [{ label: "Family memory", href: "/ancestors" }]
      },
      {
        id: "memory-annes-notes",
        title: "Anne's book notes",
        dateLabel: "Archive context: research years",
        year: memoryContextYears["annes-book-notes"],
        place: "Family archive",
        confidence: "Strong Evidence",
        category: "memory",
        summary: "Anne's working notes on Edwards, Moore, and Marchant lines.",
        supports: "A research guide that still needs matching against primary records.",
        linkedDocuments: [{ label: "Family notes", href: "/ancestors" }]
      }
    ];

    return events.sort((a, b) => (a.year ?? Number.POSITIVE_INFINITY) - (b.year ?? Number.POSITIVE_INFINITY));
  }, []);

  const filteredTimelineEvents = useMemo(
    () => timelineEvents.filter((event) => event.year != null && event.year >= startYear && event.year <= endYear),
    [timelineEvents, startYear, endYear]
  );

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
        title: "Research bridge",
        subtitle: "These are the working names that help trace the line across family story, notebook material, and later records.",
        laneStyle: "bridge",
        nodes: [
          {
            id: "aaron-marchant",
            label: "Aaron Marchant",
            subtitle: "bridge node",
            confidence: "Needs Proof",
            note: "Current archive anchor for the Marchant side of the line.",
            bridge: true
          },
          {
            id: "brett-marchant",
            label: "Brett Marchant",
            subtitle: "bridge node",
            confidence: "Needs Proof",
            note: "A working connection in the family web, not yet loaded as a profile.",
            bridge: true
          },
          {
            id: "nancy-moore-marchant",
            label: "Nancy Moore Marchant",
            subtitle: "bridge node",
            confidence: "Needs Review",
            note: "A bridge node for the Moore / Marchant side of the family.",
            bridge: true
          },
          {
            id: "edith-ann-edwards-moore",
            label: "Edith Ann Edwards Moore",
            subtitle: "bridge node",
            confidence: "Needs Review",
            note: "Still a research bridge until a primary record lands.",
            bridge: true
          },
          {
            id: "josiah-si-edwards",
            label: "Josiah “Si” Edwards",
            subtitle: "bridge node",
            confidence: "Needs Review",
            note: "Placed here to keep the working line visible while proof is assembled.",
            bridge: true
          }
        ]
      },
      {
        title: "Documented line",
        subtitle: "Loaded profiles and records already present in the archive. Dotted items are still treated carefully.",
        laneStyle: "documented",
        nodes: [
          {
            id: "nancy-ann-dyer",
            label: "Nancy Ann Dyer",
            subtitle: "loaded profile",
            confidence: "Strong Evidence",
            note: "Connects the Dyer line to the Edwards / Moore / Marchant branch.",
            href: "/ancestors/nancy-ann-dyer"
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
          }
        ]
      }
    ],
    []
  );

  const selectedWebNode = familyWebLanes.flatMap((lane) => lane.nodes).find((node) => node.id === selectedNodeId) ?? familyWebLanes.flatMap((lane) => lane.nodes)[0] ?? null;

  const heroRecordPreview = documentsByFilename.get("josiah-ramsey-family-plaque.jpg")?.previewUrl ?? "/documents/josiah-ramsey-family-plaque.jpg";
  const secondaryPreview = documentsById.get("josiah-ramsey-grave-marker")?.previewUrl;
  const tertiaryPreview = documentsById.get("josiah-ramsey-1782-military-service")?.previewUrl;
  const fourthPreview = documentsById.get("william-isabella-marriage-certificate")?.previewUrl ?? "/documents/real-certificate.jpg";

  return (
    <div className="space-y-10">
      <section className="archive-home-hero">
        <div className="archive-home-hero__copy">
          <div className="archive-eyebrow">Private research archive</div>
          <h1 className="archive-display text-5xl font-semibold tracking-tight text-[var(--archive-ink)] sm:text-6xl">
            The Living Red Book
          </h1>
          <p className="max-w-2xl text-base leading-7 text-[rgba(244,239,231,0.8)] sm:text-lg">
            A living archive of records, stories, migrations, and the people behind them.
          </p>
          <div className="flex flex-wrap gap-2 pt-2">
            <span className="archive-pill">Private</span>
            <span className="archive-pill">Record-led</span>
            <span className="archive-pill">Evidence separated from narrative</span>
            <span className="archive-pill">Living family archive</span>
          </div>
          <div className="archive-stat-grid pt-2">
            <Stat value={people.length} label="Ancestor profiles" />
            <Stat value={documents.length} label="Document records" />
            <Stat value={familyMemory.length} label="Family memory entries" />
            <Stat value={visiblePeople.length} label="Visible people" />
            <Stat value={visibleDocuments.length} label="Visible documents" />
            <Stat value={visibleMemory.length} label="Visible stories" />
          </div>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link href="#timeline" className="archive-hero-button">
              Explore timeline
            </Link>
            <Link href="#featured-record" className="archive-hero-button archive-hero-button--ghost">
              Featured record
            </Link>
            <Link href="#places" className="archive-hero-button archive-hero-button--ghost">
              Explore by place
            </Link>
          </div>
        </div>

        <div className="archive-home-hero__wall">
          <div className="grid gap-3 sm:grid-cols-2">
            <RecordTile src={heroRecordPreview} title="Josiah Ramsey family plaque" caption="Memorial plaque / family grouping" />
            <RecordTile src={secondaryPreview} title="Josiah Ramsey grave marker" caption="Memorial marker / burial memory" />
            <RecordTile src={tertiaryPreview} title="Josiah Ramsey military record" caption="Primary service image" />
            <RecordTile src={fourthPreview} title="Moore and Law marriage record" caption="Certified marriage copy" />
          </div>
          <div className="mt-4 rounded-[1.5rem] border border-[rgba(244,239,231,0.12)] bg-[rgba(244,239,231,0.04)] p-4 text-sm leading-6 text-[rgba(244,239,231,0.76)]">
            The hero wall uses real scans, census fragments, and certificates. Nothing here turns a story into proof.
          </div>
        </div>
      </section>

      <section id="timeline" className="space-y-6">
        <div className="archive-panel flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-2">
            <div className="archive-kicker">Main centerpiece</div>
            <h2 className="archive-section__title text-3xl">Family history timeline</h2>
            <p className="max-w-3xl text-sm leading-6 text-[var(--archive-text-soft)]">
              Move the year range, jump by era, and switch between the dated timeline and the family web. Solid
              markers indicate documentary anchors. Dotted markers stay visually separate when the archive is still
              building the proof.
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
              Timeline View
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
              Family Web
            </button>
          </div>
        </div>

        {viewMode === "timeline" ? (
          <ArchiveTimeline
            events={timelineEvents}
            minYear={minYear}
            maxYear={maxYear}
            startYear={startYear}
            endYear={endYear}
            onRangeChange={(nextStart, nextEnd) => {
              setStartYear(nextStart);
              setEndYear(nextEnd);
            }}
            selectedEventId={selectedEventId}
            onSelectEvent={(event) => setSelectedEventId(event.id)}
            eraJumps={eraJumps}
          />
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
                The family web keeps the direct path visible while marking bridge names differently from loaded
                profiles.
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
            <div className="archive-section__title">Featured record</div>
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
            <div className="archive-section__title">Explore by place</div>
            <div className="archive-section__copy">
              Use the place cards as entry points. Each card filters the archive toward the years and records tied
              to that location.
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
                  setStartYear(place.jump.startYear);
                  setEndYear(place.jump.endYear);
                  setViewMode("timeline");
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
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--archive-accent)] underline decoration-[rgba(139,31,43,0.28)] underline-offset-4">
                      Jump to {place.jump.label}
                    </span>
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
            <div className="archive-section__title">Documented lines</div>
            <div className="archive-section__copy">
              Ancestor profiles that fall inside the selected year window. These remain profile cards, not a
              generic family-tree dashboard.
            </div>
          </div>
          <Link className="archive-nav__link inline-flex" href="/ancestors">
            Open page
          </Link>
        </div>
        <div className="archive-grid">
          {visiblePeople.length ? (
            visiblePeople.map((person) => <AncestorCard key={person.id} {...person} />)
          ) : (
            <div className="archive-empty">
              No ancestor records fall inside the selected year range. Widen the filter or jump by era.
            </div>
          )}
        </div>
      </section>

      <section className="archive-section">
        <div className="archive-section__head">
          <div>
            <div className="archive-section__title">Evidence vault</div>
            <div className="archive-section__copy">
              Document records are metadata-first. The source file stays private and the claim is stated plainly.
            </div>
          </div>
          <Link className="archive-nav__link inline-flex" href="/documents">
            Open page
          </Link>
        </div>
        <div className="archive-grid">
          {visibleDocuments.length ? (
            visibleDocuments.map((document) => <DocumentCard key={document.id} {...document} />)
          ) : (
            <div className="archive-empty">
              No document records fall inside the selected year range. Widen the filter or choose a place card.
            </div>
          )}
        </div>
      </section>

      <section className="archive-section">
        <div className="archive-section__head">
          <div>
            <div className="archive-section__title">Family Memory / Oral History</div>
            <div className="archive-section__copy">
              Story material, family recollection, and notebook content that may guide research but stays distinct
              from sourced records.
            </div>
          </div>
        </div>
        <div className="archive-grid">
          {visibleMemory.length ? (
            visibleMemory.map((entry) => <MemoryCard key={entry.id} {...entry} />)
          ) : (
            <div className="archive-empty">
              No family memory entries fit the current context window. Jump to the later archive years to bring
              them back into view.
            </div>
          )}
        </div>
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
