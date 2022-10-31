const latestSemver = require('latest-semver');

// Find the most recent `vX.Y.Z` release tag
module.exports = async function getLatestRelease(octokit, {owner, repo}) {
    let response = await octokit.repos.listTags({owner, repo});
    let {data} = response;
    while (octokit.hasNextPage(response)) {
        response = await octokit.getNextPage(response);
        data = data.concat(response.data);
    }

    return `v${latestSemver(data.map(tag => tag.name))}`;
};
