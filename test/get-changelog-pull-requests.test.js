const test = require('tap').test;

const token = process.env.GITHUB_TOKEN;
const octokit = require('../src/octokit');
octokit.authenticate({ type: 'token', token });

const getChangelogPullRequests = require('../src/get-changelog-pull-requests');

test('getChangelogPullRequests finds and categorizes pull requests ', async function(t) {
    const owner = "mapbox";
    const repo = "mapbox-gl-js";
    const lastReleaseBase = "dae5fa3c5f30fcaa25158f780972337afdfdfe57"
    const current = "release-queso"

    const {hasChangelog, needsChangelog, skipChangelog} = await getChangelogPullRequests(octokit, {repo, owner, previous: lastReleaseBase, branch: current});
    t.equal(hasChangelog.length, 0, "hasChangelog count");
    t.equal(needsChangelog.length, 42, "needsChangelog count");
    t.equal(skipChangelog.length, 0, "skipChangelog count");
});

test('getChangeLogPullRequests filters out PRs cherry picked to the previous release');

test('getChangeLogPullRequests filters out PRs merged but then reverted');
