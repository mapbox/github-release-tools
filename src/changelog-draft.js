
const parse = require('parse-github-url');
const getRemoteUrl = require('../src/git-remote-url');
const getChangelogPullRequests = require('../src/get-changelog-pull-requests');
const getLatestRelease = require('../src/get-latest-release');
const renderSections = require('../src/render');

module.exports = async function(octokit, {repo: githubRepo, current, previous, format}) {
    const {owner, name: repo} = parse(githubRepo || await getRemoteUrl());
    previous = previous || await getLatestRelease(octokit, {repo, owner});

    console.error(`Changes: ${owner}/${repo} ${previous}...${current}`);

    const {hasChangelog, needsChangelog, skipChangelog} = await getChangelogPullRequests(octokit, {repo, owner, previous, current});
    const entries = parseChangelogEntries(hasChangelog);

    needsChangelogIds = needsChangelog.map(pr => pr.id);
    console.error(`Found ${skipChangelog.length} skipped Pull Requests.`);
    console.error(`Found ${needsChangelog.length} unskipped Pull Requests without entries: ${needsChangelogIds.join(', ')}`);

    const sections = categorizeEntries(entries);
    const formattedSections = renderSections(sections, format);

    return formattedSections;
};

function categorizeEntries(entries) {
    const sections = {
        breaking: {title: 'Breaking changes', entries: []},
        improvements: {title: 'Features and improvements', entries: []},
        bugs: {title: 'Bug fixes', entries: []},
        other: {title: 'UNCATEGORIZED', entries: []},
        maybeInternal: {title: 'MAYBE INTERNAL (workflow changes, issues filed since last release)', entries: []}
    };

    for (const entry of entries) {
        let label = entry.label;
        if (label === 'breaking') {
            section = 'breaking';
        } else if (label === 'bugs') {
            section = 'bugs';
        } else if (['feature','docs','performance'].includes(label)) {
            section = 'improvements';
        } else if (['workflow','testing'].includes(label)) {
            section = 'maybeInternal';
        } else if (label === 'other') {
            section = 'other';
        } else {
            throw new Error(`Unknown changelog entry label: ${label}`);
        }

        sections[section].entries.push(entry);
    }

    return sections;
}

function parseChangelogEntries(pullRequests) {
    const entries = [];

    for (const pr of pullRequests) {
        const label = 'other';
        const body = pr.body;
        const entry = {
            label: label,
            body: pr.title,
            pullRequest: pr,
        };
        entries.push(entry);
    }

    return entries;
}