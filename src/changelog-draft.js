
const parse = require('parse-github-url');
const getRemoteUrl = require('../src/git-remote-url');
const getChangelogPullRequests = require('../src/get-changelog-pull-requests');
const {parseEntriesFromPullRequests, categorizeEntries} = require('../src/parse-and-categorize-changelog-entries');
const getLatestRelease = require('../src/get-latest-release');
const renderSections = require('../src/render');

module.exports = async function(octokit, {repo: githubRepo, current, previous, format}) {
    const {owner, name: repo} = parse(githubRepo || await getRemoteUrl());
    previous = previous || await getLatestRelease(octokit, {repo, owner});

    console.error(`Changes: ${owner}/${repo} ${previous}...${current}`);

    const pullRequests = await getChangelogPullRequests(octokit, {repo, owner, previous, current});
    const entries = parseEntriesFromPullRequests(pullRequests);
    const sections = categorizeEntries(entries);

    console.error(`\nFound ${sections.skip.entries.length} Pull Requests that skip changelogs.\n`);
    const formattedSections = renderSections(sections, format);

    return formattedSections;
};