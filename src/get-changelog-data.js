/*::
type Commit = {
    sha: string,
    title: string,
    body: string,
    url: string,
    pr?: {
        number: number,
        title: string,
        body: string,
        url: string,
        labels: Array<string>,
        isPR: true,
        user?: {
            login: string,
            url: string
        }
    },
    issues: Array<{
        number: number,
        type: 'ref' | 'fix',
        title: string,
        body: string,
        url: string,
        created: string,
        predatesLastRelease: boolean,
        labels: Array<string>
        isIssue: true
    }>
}
*/

/*
Create an annotated log of changes from `previous...branch`. Returns
an array of Commit objects.
*/
module.exports = async function getChangelogData(octokit, {repo, owner, previous, branch}) {
    const log = await getCommits(octokit, {repo, owner, base: previous, head: branch});
    const firstCommit = await octokit.repos.getCommit({owner, repo, sha: log[0].sha});
    const previousReleaseDate = firstCommit.data.commit.committer.date;
    const prs = await fetchPrs(octokit, {repo, owner, since: previousReleaseDate, base: branch});
    const issueCache = new Map();

    for (const commit of log) {
        commit.url = `https://github.com/${owner}/${repo}/commit/${commit.sha}`;

        const pr = prs.get(commit.sha);
        const body = commit.body + ' ' + (pr ? pr.body : '');

        const issues = new Map();
        for (const {type, number} of parseIssueReferences(owner, repo, body)) {
            if (!issueCache.has(number)) {
                const {data} = await octokit.issues.get({owner, repo, number});
                if (!data) {
                    console.error(`Could not resolve issue #${number}.`);
                    continue;
                }
                const issue = {
                    number: data.number,
                    title: data.title,
                    body: data.body,
                    url: data.html_url,
                    created: data.created_at,
                    predatesLastRelease: data.created_at < previousReleaseDate,
                    labels: data.labels.map(l => l.name),
                    isIssue: true
                };
                issueCache.set(number, issue);
            }
            // if we've already seen this issue as a 'ref' but this time it's a
            // 'fix', then update
            if (!issues.has(number) || type === 'fix') {
                issues.set(number, type);
            }
        }

        if (pr) {
            pr.used = true;

            commit.pr = {
                number: pr.number,
                title: pr.title,
                body: pr.body,
                url: pr.html_url,
                labels: pr.labels.map(l => l.name),
                isPR: true
            };
            // include user info for PRs that came in from a fork
            if (pr.head.user.login !== pr.base.user.login) {
                commit.pr.user = {
                    login: pr.user.login,
                    url: pr.user.html_url
                };
            }
        }

        commit.issues = [...issues].map(([number, type]) =>
            Object.assign({type, number, pr}, issueCache.get(number)));

        commit.issues = sortBy(commit.issues, 'created');
    }

    const unusedPrs = [...prs.values()].filter(pr => !pr.used);
    if (unusedPrs.length) {
        console.error(`PRs since ${previousReleaseDate} not accounted for:`);
        for (const pr of unusedPrs) {
            console.error(`#${pr.number} ${pr.title} ${pr.html_url}`);
        }
    }

    return log;
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

    return commits.map(commit => ({
        sha: commit.sha,
        body: commit.commit.message.split('\n').slice(1).join('\n').trim(),
        title: commit.commit.message.split('\n')[0],
        url: commit.html_url
    }));
}

// Fetch all PRs updated since `since`
async function fetchPrs(octokit, {repo, owner, since}) {
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

    const result = new Map();
    for (const pr of data) {
        if (!pr.merge_commit_sha || !pr.merged_at || pr.merged_at < since) continue;
        result.set(pr.merge_commit_sha, pr);
    }

    return result;
}

function parseIssueReferences(owner, repo, text) {
    const baseUrl = `https://github.com/${owner}/${repo}`;
    const issueReferencePattern = new RegExp(`([a-zA-Z]+)\\s+(${baseUrl}/issues/|#)([0-9]+)`, 'g');

    const references = [];
    let match;
    while((match = issueReferencePattern.exec(text)) !== null) {
        const [, action, , issue] = match;
        references.push({
            type: /Close|Fix/.test(action) ? 'fix' : 'ref',
            number: Number(issue)
        });
    }

    return references;
}

function sortBy(arr, key, ascending = true) {
    const d = ascending ? 1 : -1;
    arr.sort((a, b) => a[key] > b[key] ? d : a[key] < b[key] ? -d : 0);
    return arr;
}
