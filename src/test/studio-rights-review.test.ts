import { describe, expect, it } from "vitest";
import { getStudioRightsApprovalIssues } from "@/lib/studio-rights-review";

const completeSubmission = {
  rights_holder: "Example Studios",
  rights_basis: "non_exclusive_license",
  territories: ["Ghana"],
  platforms: ["Web", "Mobile"],
  rights_start: "2026-11-01",
  rights_end: "2027-10-31",
  rights_evidence_url: "https://example.com/licence.pdf",
};

describe("Studio title rights approval gate", () => {
  it("accepts a complete rights package for human review", () => {
    expect(getStudioRightsApprovalIssues(completeSubmission)).toEqual([]);
  });
  it("blocks approval when core rights evidence or scope is missing", () => {
    const issues = getStudioRightsApprovalIssues({
      ...completeSubmission, rights_holder: " ", territories: [], platforms: [],
      rights_start: null, rights_evidence_url: null,
    });
    expect(issues).toHaveLength(5);
  });
  it("rejects insecure or malformed evidence links", () => {
    expect(getStudioRightsApprovalIssues({ ...completeSubmission, rights_evidence_url: "http://example.com/licence.pdf" }))
      .toContain("Rights evidence must use a secure HTTPS link.");
    expect(getStudioRightsApprovalIssues({ ...completeSubmission, rights_evidence_url: "not a url" }))
      .toContain("The rights evidence link is not a valid URL.");
  });
  it("rejects invalid or reversed rights dates", () => {
    expect(getStudioRightsApprovalIssues({ ...completeSubmission, rights_start: "2026-02-30" }))
      .toContain("A valid licence start date is required.");
    expect(getStudioRightsApprovalIssues({ ...completeSubmission, rights_end: "2026-10-31" }))
      .toContain("The rights end date cannot be before the start date.");
  });
  it("allows an open-ended rights window for human verification", () => {
    expect(getStudioRightsApprovalIssues({ ...completeSubmission, rights_end: null })).toEqual([]);
  });
});
