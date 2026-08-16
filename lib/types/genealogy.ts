export type ConfidenceTier =
  | "Primary Source"
  | "Confirmed"
  | "Corroborated Compilation"
  | "Strong Evidence"
  | "Family-Confirmed Oral History"
  | "Needs Review"
  | "Needs Proof";

export interface TimelineEntry {
  title: string;
  date: string;
  summary: string;
  confidence: ConfidenceTier;
  linkedDocumentId?: string | null;
  place?: string | null;
}

export interface DisputedBirthSource {
  year: number;
  source: string;
  type?: string;
  confidence?: ConfidenceTier;
}

export interface PersonRecord {
  id: string;
  name: string;
  lifespan: string;
  status?: "active" | "retired";
  merged_into?: string;
  redirect_reason?: string;
  era?: string;
  branch: string;
  summary: string;
  keyEvent: string;
  confidence: ConfidenceTier;
  aliases?: string[];
  relational_notes?: string;
  birth_year_disputed?: boolean;
  birth_year_sources?: DisputedBirthSource[];
  tags?: string[];
  attachedDocument?: string;
  sourceUrl?: string;
  sourceCitation?: string;
  timeline?: TimelineEntry[];
  evidenceSummary?: string[];
  sarLineStatus?: {
    patriotAncestor: string;
    service: string;
    keyRecord: string;
    status: string;
    note: string;
  };
  relationships?: {
    mother_id?: string;
    father_id?: string;
    mother_name?: string;
    father_name?: string;
    spouse_ids?: string[];
    child_ids?: string[];
  };
  v2_birth_year?: string;
  v2_death_year?: string;
  v2_notes?: string;
}

export interface DocumentScanRegion {
  id: string;
  label: string;
  page?: number;
  bbox: { x: number; y: number; width: number; height: number }; // normalized 0–100%
  provesFact: string;
  transcription?: string;
}

export interface DocumentRecord {
  id: string;
  filename: string;
  type: string;
  date: string;
  era?: string;
  sourceUrl?: string;
  sourceCitation?: string;
  previewUrl?: string;
  confidence: ConfidenceTier;
  people: string[];
  place?: string;
  whatItProves: string;
  notes?: string;
  regions?: DocumentScanRegion[];
}

export interface PlaceRecord {
  id: string;
  name: string;
  lat: number;
  lng: number;
  era: string;
  branches: string[];
  confidence: ConfidenceTier;
  sourceCitation: string;
  historicalContext?: string;
}
