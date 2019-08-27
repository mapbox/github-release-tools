const test = require('tap').test;

const token = process.env.GITHUB_TOKEN;
const octokit = require('../src/octokit');
octokit.authenticate({ type: 'token', token });

const getChangelogData = require('../src/get-changelog-data');

test('getChangelogData', async function(t) {
    const owner = "mapbox";
    const repo = "mapbox-gl-js";
    const lastReleaseBase = "dae5fa3c5f30fcaa25158f780972337afdfdfe57"
    const current = "release-queso"

    const commits = await getChangelogData(octokit, {repo, owner, previous: lastReleaseBase, branch: current});
    t.equal(commits.length, 53);
});
