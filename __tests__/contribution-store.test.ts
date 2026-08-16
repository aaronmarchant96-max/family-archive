import { addContribution, getContributions, updateContributionStatus } from "../lib/contributionStore";

describe("Contribution Store", () => {
  const testTargetId = "william-ramsey-1675";

  test("adds a valid contribution with pending status", async () => {
    const uniqueKey = `test-key-${Date.now()}-${Math.random()}`;
    const result = await addContribution({
      targetPersonId: testTargetId,
      contributorName: "Aaron Marchant",
      type: "story",
      content: "Oral history passed down regarding the frontier homestead.",
      idempotencyKey: uniqueKey
    });

    expect(result.created).toBe(true);
    expect(result.contribution.id).toMatch(/^contrib-/);
    expect(result.contribution.status).toBe("pending");
    expect(result.contribution.idempotencyKey).toBe(uniqueKey);
  });

  test("enforces idempotency on duplicate submissions with same idempotencyKey", async () => {
    const dupKey = `dup-key-${Date.now()}`;
    const first = await addContribution({
      targetPersonId: testTargetId,
      contributorName: "Aaron Marchant",
      type: "correction",
      content: "Correct birth location to Virginia Colony.",
      idempotencyKey: dupKey
    });
    expect(first.created).toBe(true);

    const second = await addContribution({
      targetPersonId: testTargetId,
      contributorName: "Aaron Marchant",
      type: "correction",
      content: "Correct birth location to Virginia Colony.",
      idempotencyKey: dupKey
    });
    expect(second.created).toBe(false);
    expect(second.contribution.id).toBe(first.contribution.id);
  });

  test("updates contribution status to approved", async () => {
    const key = `status-test-${Date.now()}`;
    const { contribution } = await addContribution({
      targetPersonId: testTargetId,
      contributorName: "Aaron Marchant",
      type: "photo",
      content: "Family bible page scan upload.",
      idempotencyKey: key
    });

    const updated = await updateContributionStatus(contribution.id, "approved");
    expect(updated).not.toBeNull();
    expect(updated?.status).toBe("approved");
  });
});
