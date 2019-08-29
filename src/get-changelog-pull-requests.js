/*
Find all Pull Requests merged in `current` release since `previous` release, ignoring any that were cherry-picked to previous release.
Returns Pull Requests categorized by their changelog status: has changelog, needs changelog, and skipped changelog.
*/
module.exports = async function getChangelogPullRequests(octokit, {repo, owner, previous, current}) {
    const sharedBase = await findMergeBase(octokit, {repo, owner, base: previous, head: current});
    const log = await getCommits(octokit, {repo, owner, base: sharedBase.sha, head: current});
    const previousReleaseBranchDate = sharedBase.commit.committer.date;
    const pullRequestsSince = await fetchMergedPullRequestsSinceDate(octokit, {
        repo, owner, since: previousReleaseBranchDate
    });
    const pullRequestsInBranch = [];

    for (const commit of log) {
        const includedPr = pullRequestsSince.find((pr) => {
            return pr.merge_commit_sha === commit.sha;
        });

        if (includedPr) {
            pullRequestsInBranch.push(includedPr);
        }
    }

    const categorized = categorizePullRequests(pullRequestsInBranch); 
    return categorized;
};

// Equivalent to `git log base..head`
async function getCommits(octokit, {owner, repo, base, head}) {
    let response = await octokit.repos.compareCommits({
        owner,
        repo,
        base,
        head,
        headers: { accept: 'application/vnd.github.v3.sha' }
    });

    let {commits} = response.data;
    if (response.data.total_commits > commits.length) {
        console.error(`Warning: ${head} is ahead of ${base} by ${response.data.total_commits}, but only ${commits.length} are included in the result.`);
    }

    return commits;
}

async function findMergeBase(octokit, {owner, repo, base, head}) {
    const response = await octokit.repos.compareCommits({
        owner,
        repo,
        base,
        head,
        headers: { accept: 'application/vnd.github.v3.sha' }
    });

    return response.data.merge_base_commit;
}

async function fetchMergedPullRequestsSinceDate(octokit, {repo, owner, since}) {
    let response = await octokit.pullRequests.getAll({
        owner,
        repo,
        state: 'closed',
        sort: 'updated',
        direction: 'desc',
        per_page: 100
    });
    let {data} = response;
    while (data[data.length - 1].updated_at > since && octokit.hasNextPage(response)) {
        response = await octokit.getNextPage(response);
        data = data.concat(response.data);
    }

    const pullRequests = [];
    for (const pr of data) {
        if (pr.merge_commit_sha && pr.merged_at && pr.merged_at >= since) {
            pullRequests.push(pr);
        };
    }

    return pullRequests;
}

function categorizePullRequests(pullRequests) {
    const hasChangelog = []
    const skipChangelog = [];
    const needsChangelog = [];

    for (const pr of pullRequests) {
        const labelNames = pr.labels.map(l => l.name);
        if (labelNames.includes('skip changelog')) {
            skipChangelog.push(pr);
        } else if (labelNames.includes('needs changelog')) {
            needsChangelog.push(pr);
        } else {
            hasChangelog.push(pr);
        }
    }

    return {hasChangelog, needsChangelog, skipChangelog};
}