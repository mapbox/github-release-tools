const test = require('tap').test;

const token = process.env.GITHUB_TOKEN;
const octokit = require('../src/octokit');
octokit.authenticate({ type: 'token', token });

const getChangelogPullRequests = require('../src/get-changelog-pull-requests');

test('getChangelogPullRequests finds and categorizes pull requests ', async function(t) {
    const owner = 'mapbox';
    const repo = 'mapbox-gl-js';
    const previous = 'v1.2.1';
    const current = 'release-queso';

    const {hasChangelog, needsChangelog, skipChangelog} = await getChangelogPullRequests(octokit, {
        repo, owner, previous, current
    });
    t.equal(hasChangelog.length, 37, 'hasChangelog count');
    t.equal(needsChangelog.length, 2, 'needsChangelog count');
    t.equal(skipChangelog.length, 3, 'skipChangelog count');
});

test('getChangeLogPullRequests filters out PRs cherry picked to the previous release');

test('getChangeLogPullRequests filters out PRs merged but then reverted');
