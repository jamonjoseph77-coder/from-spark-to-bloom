export interface StudioRightsReviewFields {
  rights_holder: string;
  rights_basis: string;
  territories: string[];
  platforms: string[];
  rights_start: string | null;
  rights_end: string | null;
  rights_evidence_url: string | null;
}

/** Completeness checks only; an authorised human must verify the underlying rights evidence. */
export function getStudioRightsApprovalIssues(submission: StudioRightsReviewFields): string[] {
  const issues: string[] = [];
  if (typeof submission.rights_holder !== "string" || submission.rights_holder.trim().length < 2)
    issues.push("A named rights holder is required.");
  if (typeof submission.rights_basis !== "string" || !submission.rights_basis.trim())
    issues.push("The basis of the distribution rights must be selected.");
  if (!Array.isArray(submission.territories) || !submission.territories.length)
    issues.push("At least one licensed territory is required.");
  if (!Array.isArray(submission.platforms) || !submission.platforms.length)
    issues.push("At least one licensed Cinema platform is required.");
  const validDate = (value: string | null) => value === null || (
    typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)
    && Number.isFinite(Date.parse(value + "T00:00:00.000Z"))
    && new Date(value + "T00:00:00.000Z").toISOString().slice(0, 10) === value
  );
  if (!submission.rights_start || !validDate(submission.rights_start))
    issues.push("A valid licence start date is required.");
  if (!validDate(submission.rights_end))
    issues.push("The licence end date is invalid.");
  if (submission.rights_start && submission.rights_end && submission.rights_end < submission.rights_start)
    issues.push("The rights end date cannot be before the start date.");
  if (!submission.rights_evidence_url?.trim()) {
    issues.push("A link to the rights agreement or supporting evidence is required.");
  } else {
    try {
      if (new URL(submission.rights_evidence_url).protocol !== "https:")
        issues.push("Rights evidence must use a secure HTTPS link.");
    } catch {
      issues.push("The rights evidence link is not a valid URL.");
    }
  }
  return issues;
}
