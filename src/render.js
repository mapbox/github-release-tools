

exports.commitSummary = function commitSummary(commit) {
    const {issues, pr} = commit;
    const title = pr ? formatIssue(pr) : `${commit.title} ([${commit.sha.slice(0, 7)}](${commit.url}))`;

    let hattip = '';
    if (pr && pr.user) {
        hattip = ` (h/t [${pr.user.login}](${pr.user.url}))`;
    }

    const fixed = issues.filter(i => i.type === 'fix');
    if (fixed.length === 1) {
        const issue = fixed[0];
        return `${/^Fix/.test(issue.title) ? '' : 'Fix '}${formatIssue(issue)}${hattip}`;
    } else if (fixed.length > 1) {
        const issueList = fixed.map(i => `- ${formatIssue(i)}`).join('\n');
        return `${title}${hattip}\n${issueList}`;
    }

    return `${title}${hattip}`;
};

function formatIssue(issue) {
    const pr = issue.pr;
    const prRef = pr ? `, fixed by [#${pr.number}](${pr.html_url})` : '';
    let labels = '';
    if (issue.labels && issue.labels.length) {
        labels = ' ' + issue.labels
            .map(l => `\`${l.replace(/:[a-zA-Z_]+:/g, '').trim()}\``)
            .join(' ');
    }
    return `${issue.title}${labels} ([#${issue.number}](${issue.url})${prRef})`;
}

