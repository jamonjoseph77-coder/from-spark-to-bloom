export interface StudioRightsReviewFields {
  rights_holder: string;
  rights_basis: string;
  territories: string[];
  platforms: string[];
  rights_start: string | null;
  rights_end: string | null;
  rights_evidence_url: string | null;
}

/**
 * Minimum submission completeness checks before an administrator can approve
 * a title for distribution preparation. This does not verify ownership or
 * replace a human review of the underlying agreement.
 */
export function getStudioRightsApprovalIssues(submission: StudioRightsReviewFields): string[] {
  const issues: string[] = [];
  if (submission.rights_holder.trim().length < 2) issues.push('A named rights holder is required.');
  if (!submission.rights_basis.trim()) issues.push('The basis of the distribution rights must be selected.');
  if (!submission.territories.length) issues.push('At least one licensed territory is required.');
  if (!submission.platforms.length) issues.push('At least one licensed Cinema platform is required.');
  if (!submission.rights_start) issues.push('The licence start date is required.');
  if (!submission.rights_evidence_url?.trim()) {
    issues.push('A link to the rights agreement or supporting evidence is required.');
  } else {
    try {
      if (new URL(submission.rights_evidence_url).protocol !== 'https:') {
        issues.push('Rights evidence must use a secure HTTPS link.');
      }
    } catch {
      issues.push('The rights evidence link is not a valid URL.');
    }
  }
  if (submission.rights_start && submission.rights_end && submission.rights_end < submission.rights_start) {
    issues.push('The rights end date cannot be before the start date.');
  }
  return issues;
}
