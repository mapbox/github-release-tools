const latestSemver = require('latest-semver');
const octokit = require('./octokit');

// Find the most recent `vX.Y.Z` release tag
module.exports = async function getLatestRelease({owner, repo}) {
    let response = await octokit.repos.getTags({owner, repo});
    let {data} = response;
    while (octokit.hasNextPage(response)) {
        response = await octokit.getNextPage(response);
        data = data.concat(response.data);
    }

    return `v${latestSemver(data.map(tag => tag.name))}`;
};
