const test = require('tap').test;

const token = process.env.GITHUB_TOKEN;
const octokit = require('../src/octokit');
octokit.authenticate({ type: 'token', token });

const getChangelogPullRequests = require('../src/get-changelog-pull-requests');

test('getChangelogPullRequests finds and categorizes pull requests ', async function(t) {
    const owner = 'mapbox';
    const repo = 'mapbox-gl-js';
    const previous = 'v1.1.1';
    const current = 'v1.2.1';

    const {hasChangelog, needsChangelog, skipChangelog} = await getChangelogPullRequests(octokit, {
        repo, owner, previous, current
    });
    t.equal(hasChangelog.length, 20, 'hasChangelog count');
    t.equal(needsChangelog.length, 0, 'needsChangelog count');
    t.equal(skipChangelog.length, 0, 'skipChangelog count');
});

test('getChangeLogPullRequests filters out PRs cherry picked to the previous release', async function(t) {
    const owner = 'mapbox';
    const repo = 'mapbox-gl-js';
    // These versions are tested because v1.2.1 contains a cherry pick.
    const previous = 'v1.2.1';
    const current = 'v1.3.0';

    const {hasChangelog, needsChangelog, skipChangelog} = await getChangelogPullRequests(octokit, {
        repo, owner, previous, current
    });
    t.equal(hasChangelog.length, 36, 'hasChangelog count');
    t.equal(needsChangelog.length, 2, 'needsChangelog count');
    t.equal(skipChangelog.length, 3, 'skipChangelog count');
});

test('getChangeLogPullRequests filters out PRs merged but then reverted');
