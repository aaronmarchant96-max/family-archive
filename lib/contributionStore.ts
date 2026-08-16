import fs from "fs/promises";
import path from "path";

export interface Contribution {
  id: string;
  idempotencyKey: string;
  targetPersonId: string;
  contributorName: string;
  type: "story" | "photo" | "correction";
  content: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}

// Storage path: in local development, use data/contributions.json; in read-only serverless, use /tmp
const LOCAL_STORAGE_PATH = path.join(process.cwd(), "data", "contributions.json");
const TMP_STORAGE_PATH = path.join("/tmp", "family_archive_contributions.json");

// In-memory fallback if filesystem is completely read-only or in ephemeral environments
let inMemoryContributions: Contribution[] = [];

// Simple async file lock to prevent concurrent write corruption
let writeLock = Promise.resolve();

function withLock<T>(fn: () => Promise<T>): Promise<T> {
  const result = writeLock.then(fn);
  writeLock = result.then(() => {}, () => {});
  return result;
}

async function getUsableStoragePath(): Promise<string> {
  try {
    await fs.access(path.dirname(LOCAL_STORAGE_PATH), 2 /* W_OK */);
    return LOCAL_STORAGE_PATH;
  } catch {
    return TMP_STORAGE_PATH;
  }
}

export async function getContributions(): Promise<Contribution[]> {
  const targetPath = await getUsableStoragePath();
  try {
    const data = await fs.readFile(targetPath, "utf-8");
    const parsed = JSON.parse(data);
    if (Array.isArray(parsed)) {
      inMemoryContributions = parsed;
      return parsed;
    }
    return inMemoryContributions;
  } catch (err: any) {
    if (err.code === "ENOENT") {
      return inMemoryContributions;
    }
    return inMemoryContributions;
  }
}

export async function addContribution(
  input: Omit<Contribution, "id" | "status" | "createdAt">
): Promise<{ contribution: Contribution; created: boolean }> {
  return withLock(async () => {
    const existing = await getContributions();

    // Idempotency check: prevent duplicate submissions
    const duplicate = existing.find(
      (c) => c.idempotencyKey === input.idempotencyKey
    );
    if (duplicate) {
      return { contribution: duplicate, created: false };
    }

    const newEntry: Contribution = {
      ...input,
      id: `contrib-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      status: "pending",
      createdAt: new Date().toISOString()
    };

    const updated = [...existing, newEntry];
    inMemoryContributions = updated;

    const targetPath = await getUsableStoragePath();
    const tmpPath = `${targetPath}.tmp`;

    try {
      await fs.writeFile(tmpPath, JSON.stringify(updated, null, 2), "utf-8");
      await fs.rename(tmpPath, targetPath);
    } catch {
      // If disk write fails in serverless sandbox, state is safely preserved in memory
    }

    return { contribution: newEntry, created: true };
  });
}

export async function updateContributionStatus(
  id: string,
  status: "approved" | "rejected"
): Promise<Contribution | null> {
  return withLock(async () => {
    const existing = await getContributions();
    const target = existing.find((c) => c.id === id);
    if (!target) return null;

    target.status = status;
    inMemoryContributions = existing;

    const targetPath = await getUsableStoragePath();
    const tmpPath = `${targetPath}.tmp`;

    try {
      await fs.writeFile(tmpPath, JSON.stringify(existing, null, 2), "utf-8");
      await fs.rename(tmpPath, targetPath);
    } catch {
      // In-memory state preserved
    }

    return target;
  });
}
