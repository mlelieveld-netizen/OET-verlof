// GitHub API utility functions
// Store leave requests as GitHub Issues for notifications

const GITHUB_REPO = 'mlelieveld-netizen/OET-verlof';
// GitHub token from environment variable or empty string
// For GitHub Pages, we need to use a different approach since env vars aren't available
// We'll use GitHub's built-in notifications instead
const GITHUB_TOKEN = typeof import.meta !== 'undefined' && import.meta.env ? (import.meta.env.VITE_GITHUB_TOKEN || '') : '';

// Create GitHub Issue for leave request
export const createLeaveRequestIssue = async (request, adminLink) => {
  if (!GITHUB_TOKEN) {
    console.warn('GitHub token not configured. Skipping issue creation.');
    return null;
  }

  const issueTitle = `Verlofaanvraag: ${request.employeeName} - ${new Date(request.startDate).toLocaleDateString('nl-NL')}`;
  
  const issueBody = `## Verlofaanvraag

**Medewerker:** ${request.employeeName}
**Type:** ${request.type}
**Datum:** ${new Date(request.startDate).toLocaleDateString('nl-NL')}${request.endDate !== request.startDate ? ` - ${new Date(request.endDate).toLocaleDateString('nl-NL')}` : ''}
${request.startTime && request.endTime ? `**Tijd:** ${request.startTime} - ${request.endTime}\n` : ''}
${request.reason ? `**Reden:** ${request.reason}\n` : ''}

**Beheerder link:** ${adminLink}

---
*Aangemaakt op: ${new Date(request.createdAt).toLocaleString('nl-NL')}*
*Request ID: ${request.id}*
*Token: ${request.adminToken}*`;

  try {
    const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/issues`, {
      method: 'POST',
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: issueTitle,
        body: issueBody,
        labels: ['verlof-aanvraag', 'pending'],
      }),
    });

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.statusText}`);
    }

    const issue = await response.json();
    return issue;
  } catch (error) {
    console.error('Error creating GitHub issue:', error);
    return null;
  }
};

// Update issue when request is approved/rejected
export const updateLeaveRequestIssue = async (issueNumber, status) => {
  if (!GITHUB_TOKEN || !issueNumber) {
    return null;
  }

  const labels = status === 'approved' 
    ? ['verlof-aanvraag', 'approved']
    : ['verlof-aanvraag', 'rejected'];

  try {
    const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/issues/${issueNumber}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        state: 'closed',
        labels: labels,
      }),
    });

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating GitHub issue:', error);
    return null;
  }
};

// Add comment to issue
export const addIssueComment = async (issueNumber, comment) => {
  if (!GITHUB_TOKEN || !issueNumber) {
    return null;
  }

  try {
    const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/issues/${issueNumber}/comments`, {
      method: 'POST',
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        body: comment,
      }),
    });

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error adding comment to GitHub issue:', error);
    return null;
  }
};

