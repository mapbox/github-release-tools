
const parse = require('parse-github-url');
const getRemoteUrl = require('../src/git-remote-url');
const getChangelogData = require('../src/get-changelog-data');
const getLatestRelease = require('../src/get-latest-release');
const {commitSummary} = require('../src/render');

module.exports = async function(octokit, {repo: githubRepo, branch, previous, format}) {
    const {owner, name: repo} = parse(githubRepo || await getRemoteUrl());
    previous = previous || await getLatestRelease(octokit, {repo, owner});

    console.error(`Changes: ${owner}/${repo} ${previous}...${branch}`);

    const log = await getChangelogData(octokit, {repo, owner, previous, branch});
    return format === 'json' ? JSON.stringify(log) : render(log);
};

function render(log) {
    let output = '';
    const sections = {
        breaking: {title: 'Breaking changes', commits: []},
        bugs: {title: 'Bug fixes', commits: []},
        improvements: {title: 'Features and improvements', commits: []},
        other: {title: 'UNCATEGORIZED', commits: []},
        maybeInternal: {title: 'MAYBE INTERNAL (workflow changes, issues filed since last release)', commits: []}
    };

    for (const commit of log) {
        let labels = new Set(commit.pr ? commit.pr.labels : []);
        for (const issue of commit.issues) {
            for (const label of issue.labels) {
                labels.add(label);
            }
        }

        labels = [...labels].join(' ');

        const maybeInternal = commit.issues.length && commit.issues.every(i => i.predatesLastRelease);

        let section = 'other';
        if (/breaking/.test(labels)) {
            section = 'breaking';
        } else if (maybeInternal) {
            section = 'maybeInternal';
        } else if (/bug/.test(labels)) {
            section = 'bugs';
        } else if (/feature|docs|performance/.test(labels)) {
            section = 'improvements';
        } else if (/workflow|testing/.test(labels)) {
            section = 'maybeInternal';
        }

        sections[section].commits.push(commit);
    }

    for (const key in sections) {
        const section = sections[key];
        output += `\n\n## ${section.title}\n`;
        for (const commit of section.commits) {
            output += commitSummary(commit)
                .split('\n')
                .map((line, i) => i === 0 ? `* ${line}` : `  ${line}`)
                .join('\n') + '\n';
        }
    }

    return output;
}
