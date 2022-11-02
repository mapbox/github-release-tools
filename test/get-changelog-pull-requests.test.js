const t = require('tap').test;

const token = process.env.GITHUB_TOKEN;
const octokit = require('../src/octokit');
octokit.authenticate({ type: 'token', token });

const getChangelogPullRequests = require('../src/get-changelog-pull-requests');

t.test('getChangelogPullRequests finds all relevant pull requests', async function(t) {
    const owner = 'mapbox';
    const repo = 'mapbox-gl-js';
    const previous = 'v1.1.1';
    const current = 'v2.10.0';

    const pullRequests = await getChangelogPullRequests(octokit, {
        repo, owner, previous, current
    });

    t.equal(pullRequests.length, 20, 'Pull request count incorrect');
    t.end();
});

t.test('getChangeLogPullRequests filters out PRs cherry picked to the previous release', async function(t) {
    const owner = 'mapbox';
    const repo = 'mapbox-gl-js';
    // These versions are tested because v1.2.1 contains a cherry pick.
    const previous = 'v1.2.1';
    const current = 'v1.3.0';

    const pullRequests = await getChangelogPullRequests(octokit, {
        repo, owner, previous, current
    });

    
    t.equal(pullRequests.length, 41, 'Pull request count incorrect');
    t.end();
});
