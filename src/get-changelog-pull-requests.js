/*
Find all Pull Requests merged in `current` release since `previous` release, ignoring any that were cherry-picked to previous release.
Returns Pull Requests categorized by their changelog status: has changelog, needs changelog, and skipped changelog.
*/
module.exports = async function getChangelogPullRequests(octokit, {repo, owner, previous, current}) {
    const sharedBase = await findMergeBase(octokit, {repo, owner, base: previous, head: current});
    const currentLog = await getCommits(octokit, {repo, owner, base: sharedBase.sha, head: current});
    const previousLog = await getCommits(octokit, {repo, owner, base: sharedBase.sha, head: previous});
    const previousReleaseBranchDate = sharedBase.commit.committer.date;
    const pullRequestsSince = await fetchMergedPullRequestsSinceDate(octokit, {
        repo, owner, since: previousReleaseBranchDate
    });
    const pullRequestsInBranch = [];

    for (const commit of currentLog) {
        const includedPr = pullRequestsSince.find((pr) => {
            return pr.merge_commit_sha === commit.sha;
        });

        const previouslyCherryPicked = detectCherryPicksOfCommitWithinLog(commit, previousLog);

        if (includedPr && !previouslyCherryPicked) {
            pullRequestsInBranch.push(includedPr);
        }
    }

    return pullRequestsInBranch;
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
    let response = await octokit.pullRequests.list({
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

// Heuristic used to detect cherry picks.
// Search for a commit message as a substring within a log of commits.
function detectCherryPicksOfCommitWithinLog(commit, log) {
    const found = log.some((logCommit) => {
        return logCommit.commit.message.includes(commit.commit.message);
    });

    return found;
}

[
    {
      "url": "https://api.github.com/repos/octocat/Hello-World/pulls/1347",
      "id": 1,
      "node_id": "MDExOlB1bGxSZXF1ZXN0MQ==",
      "html_url": "https://github.com/octocat/Hello-World/pull/1347",
      "diff_url": "https://github.com/octocat/Hello-World/pull/1347.diff",
      "patch_url": "https://github.com/octocat/Hello-World/pull/1347.patch",
      "issue_url": "https://api.github.com/repos/octocat/Hello-World/issues/1347",
      "commits_url": "https://api.github.com/repos/octocat/Hello-World/pulls/1347/commits",
      "review_comments_url": "https://api.github.com/repos/octocat/Hello-World/pulls/1347/comments",
      "review_comment_url": "https://api.github.com/repos/octocat/Hello-World/pulls/comments{/number}",
      "comments_url": "https://api.github.com/repos/octocat/Hello-World/issues/1347/comments",
      "statuses_url": "https://api.github.com/repos/octocat/Hello-World/statuses/6dcb09b5b57875f334f61aebed695e2e4193db5e",
      "number": 1347,
      "state": "open",
      "locked": true,
      "title": "Amazing new feature",
      "user": {
        "login": "octocat",
        "id": 1,
        "node_id": "MDQ6VXNlcjE=",
        "avatar_url": "https://github.com/images/error/octocat_happy.gif",
        "gravatar_id": "",
        "url": "https://api.github.com/users/octocat",
        "html_url": "https://github.com/octocat",
        "followers_url": "https://api.github.com/users/octocat/followers",
        "following_url": "https://api.github.com/users/octocat/following{/other_user}",
        "gists_url": "https://api.github.com/users/octocat/gists{/gist_id}",
        "starred_url": "https://api.github.com/users/octocat/starred{/owner}{/repo}",
        "subscriptions_url": "https://api.github.com/users/octocat/subscriptions",
        "organizations_url": "https://api.github.com/users/octocat/orgs",
        "repos_url": "https://api.github.com/users/octocat/repos",
        "events_url": "https://api.github.com/users/octocat/events{/privacy}",
        "received_events_url": "https://api.github.com/users/octocat/received_events",
        "type": "User",
        "site_admin": false
      },
      "body": "Please pull these awesome changes in!",
      "labels": [
        {
          "id": 208045946,
          "node_id": "MDU6TGFiZWwyMDgwNDU5NDY=",
          "url": "https://api.github.com/repos/octocat/Hello-World/labels/bug",
          "name": "bug",
          "description": "Something isn't working",
          "color": "f29513",
          "default": true
        }
      ],
      "active_lock_reason": "too heated",
      "created_at": "2011-01-26T19:01:12Z",
      "updated_at": "2011-01-26T19:01:12Z",
      "closed_at": "2011-01-26T19:01:12Z",
      "merged_at": "2011-01-26T19:01:12Z",
      "merge_commit_sha": "e5bd3914e2e596debea16f433f57875b5b90bcd6",
      "assignee": {
        "login": "octocat",
        "id": 1,
        "node_id": "MDQ6VXNlcjE=",
        "avatar_url": "https://github.com/images/error/octocat_happy.gif",
        "gravatar_id": "",
        "url": "https://api.github.com/users/octocat",
        "html_url": "https://github.com/octocat",
        "followers_url": "https://api.github.com/users/octocat/followers",
        "following_url": "https://api.github.com/users/octocat/following{/other_user}",
        "gists_url": "https://api.github.com/users/octocat/gists{/gist_id}",
        "starred_url": "https://api.github.com/users/octocat/starred{/owner}{/repo}",
        "subscriptions_url": "https://api.github.com/users/octocat/subscriptions",
        "organizations_url": "https://api.github.com/users/octocat/orgs",
        "repos_url": "https://api.github.com/users/octocat/repos",
        "events_url": "https://api.github.com/users/octocat/events{/privacy}",
        "received_events_url": "https://api.github.com/users/octocat/received_events",
        "type": "User",
        "site_admin": false
      },
      "assignees": [
        {
          "login": "octocat",
          "id": 1,
          "node_id": "MDQ6VXNlcjE=",
          "avatar_url": "https://github.com/images/error/octocat_happy.gif",
          "gravatar_id": "",
          "url": "https://api.github.com/users/octocat",
          "html_url": "https://github.com/octocat",
          "followers_url": "https://api.github.com/users/octocat/followers",
          "following_url": "https://api.github.com/users/octocat/following{/other_user}",
          "gists_url": "https://api.github.com/users/octocat/gists{/gist_id}",
          "starred_url": "https://api.github.com/users/octocat/starred{/owner}{/repo}",
          "subscriptions_url": "https://api.github.com/users/octocat/subscriptions",
          "organizations_url": "https://api.github.com/users/octocat/orgs",
          "repos_url": "https://api.github.com/users/octocat/repos",
          "events_url": "https://api.github.com/users/octocat/events{/privacy}",
          "received_events_url": "https://api.github.com/users/octocat/received_events",
          "type": "User",
          "site_admin": false
        },
        {
          "login": "hubot",
          "id": 1,
          "node_id": "MDQ6VXNlcjE=",
          "avatar_url": "https://github.com/images/error/hubot_happy.gif",
          "gravatar_id": "",
          "url": "https://api.github.com/users/hubot",
          "html_url": "https://github.com/hubot",
          "followers_url": "https://api.github.com/users/hubot/followers",
          "following_url": "https://api.github.com/users/hubot/following{/other_user}",
          "gists_url": "https://api.github.com/users/hubot/gists{/gist_id}",
          "starred_url": "https://api.github.com/users/hubot/starred{/owner}{/repo}",
          "subscriptions_url": "https://api.github.com/users/hubot/subscriptions",
          "organizations_url": "https://api.github.com/users/hubot/orgs",
          "repos_url": "https://api.github.com/users/hubot/repos",
          "events_url": "https://api.github.com/users/hubot/events{/privacy}",
          "received_events_url": "https://api.github.com/users/hubot/received_events",
          "type": "User",
          "site_admin": true
        }
      ],
      "requested_reviewers": [
        {
          "login": "other_user",
          "id": 1,
          "node_id": "MDQ6VXNlcjE=",
          "avatar_url": "https://github.com/images/error/other_user_happy.gif",
          "gravatar_id": "",
          "url": "https://api.github.com/users/other_user",
          "html_url": "https://github.com/other_user",
          "followers_url": "https://api.github.com/users/other_user/followers",
          "following_url": "https://api.github.com/users/other_user/following{/other_user}",
          "gists_url": "https://api.github.com/users/other_user/gists{/gist_id}",
          "starred_url": "https://api.github.com/users/other_user/starred{/owner}{/repo}",
          "subscriptions_url": "https://api.github.com/users/other_user/subscriptions",
          "organizations_url": "https://api.github.com/users/other_user/orgs",
          "repos_url": "https://api.github.com/users/other_user/repos",
          "events_url": "https://api.github.com/users/other_user/events{/privacy}",
          "received_events_url": "https://api.github.com/users/other_user/received_events",
          "type": "User",
          "site_admin": false
        }
      ],
      "requested_teams": [
        {
          "id": 1,
          "node_id": "MDQ6VGVhbTE=",
          "url": "https://api.github.com/teams/1",
          "html_url": "https://github.com/orgs/github/teams/justice-league",
          "name": "Justice League",
          "slug": "justice-league",
          "description": "A great team.",
          "privacy": "closed",
          "permission": "admin",
          "members_url": "https://api.github.com/teams/1/members{/member}",
          "repositories_url": "https://api.github.com/teams/1/repos",
          "parent": null
        }
      ],
      "head": {
        "label": "octocat:new-topic",
        "ref": "new-topic",
        "sha": "6dcb09b5b57875f334f61aebed695e2e4193db5e",
        "user": {
          "login": "octocat",
          "id": 1,
          "node_id": "MDQ6VXNlcjE=",
          "avatar_url": "https://github.com/images/error/octocat_happy.gif",
          "gravatar_id": "",
          "url": "https://api.github.com/users/octocat",
          "html_url": "https://github.com/octocat",
          "followers_url": "https://api.github.com/users/octocat/followers",
          "following_url": "https://api.github.com/users/octocat/following{/other_user}",
          "gists_url": "https://api.github.com/users/octocat/gists{/gist_id}",
          "starred_url": "https://api.github.com/users/octocat/starred{/owner}{/repo}",
          "subscriptions_url": "https://api.github.com/users/octocat/subscriptions",
          "organizations_url": "https://api.github.com/users/octocat/orgs",
          "repos_url": "https://api.github.com/users/octocat/repos",
          "events_url": "https://api.github.com/users/octocat/events{/privacy}",
          "received_events_url": "https://api.github.com/users/octocat/received_events",
          "type": "User",
          "site_admin": false
        },
        "repo": {
          "id": 1296269,
          "node_id": "MDEwOlJlcG9zaXRvcnkxMjk2MjY5",
          "name": "Hello-World",
          "full_name": "octocat/Hello-World",
          "owner": {
            "login": "octocat",
            "id": 1,
            "node_id": "MDQ6VXNlcjE=",
            "avatar_url": "https://github.com/images/error/octocat_happy.gif",
            "gravatar_id": "",
            "url": "https://api.github.com/users/octocat",
            "html_url": "https://github.com/octocat",
            "followers_url": "https://api.github.com/users/octocat/followers",
            "following_url": "https://api.github.com/users/octocat/following{/other_user}",
            "gists_url": "https://api.github.com/users/octocat/gists{/gist_id}",
            "starred_url": "https://api.github.com/users/octocat/starred{/owner}{/repo}",
            "subscriptions_url": "https://api.github.com/users/octocat/subscriptions",
            "organizations_url": "https://api.github.com/users/octocat/orgs",
            "repos_url": "https://api.github.com/users/octocat/repos",
            "events_url": "https://api.github.com/users/octocat/events{/privacy}",
            "received_events_url": "https://api.github.com/users/octocat/received_events",
            "type": "User",
            "site_admin": false
          },
          "private": false,
          "html_url": "https://github.com/octocat/Hello-World",
          "description": "This your first repo!",
          "fork": false,
          "url": "https://api.github.com/repos/octocat/Hello-World",
          "archive_url": "https://api.github.com/repos/octocat/Hello-World/{archive_format}{/ref}",
          "assignees_url": "https://api.github.com/repos/octocat/Hello-World/assignees{/user}",
          "blobs_url": "https://api.github.com/repos/octocat/Hello-World/git/blobs{/sha}",
          "branches_url": "https://api.github.com/repos/octocat/Hello-World/branches{/branch}",
          "collaborators_url": "https://api.github.com/repos/octocat/Hello-World/collaborators{/collaborator}",
          "comments_url": "https://api.github.com/repos/octocat/Hello-World/comments{/number}",
          "commits_url": "https://api.github.com/repos/octocat/Hello-World/commits{/sha}",
          "compare_url": "https://api.github.com/repos/octocat/Hello-World/compare/{base}...{head}",
          "contents_url": "https://api.github.com/repos/octocat/Hello-World/contents/{+path}",
          "contributors_url": "https://api.github.com/repos/octocat/Hello-World/contributors",
          "deployments_url": "https://api.github.com/repos/octocat/Hello-World/deployments",
          "downloads_url": "https://api.github.com/repos/octocat/Hello-World/downloads",
          "events_url": "https://api.github.com/repos/octocat/Hello-World/events",
          "forks_url": "https://api.github.com/repos/octocat/Hello-World/forks",
          "git_commits_url": "https://api.github.com/repos/octocat/Hello-World/git/commits{/sha}",
          "git_refs_url": "https://api.github.com/repos/octocat/Hello-World/git/refs{/sha}",
          "git_tags_url": "https://api.github.com/repos/octocat/Hello-World/git/tags{/sha}",
          "git_url": "git:github.com/octocat/Hello-World.git",
          "issue_comment_url": "https://api.github.com/repos/octocat/Hello-World/issues/comments{/number}",
          "issue_events_url": "https://api.github.com/repos/octocat/Hello-World/issues/events{/number}",
          "issues_url": "https://api.github.com/repos/octocat/Hello-World/issues{/number}",
          "keys_url": "https://api.github.com/repos/octocat/Hello-World/keys{/key_id}",
          "labels_url": "https://api.github.com/repos/octocat/Hello-World/labels{/name}",
          "languages_url": "https://api.github.com/repos/octocat/Hello-World/languages",
          "merges_url": "https://api.github.com/repos/octocat/Hello-World/merges",
          "milestones_url": "https://api.github.com/repos/octocat/Hello-World/milestones{/number}",
          "notifications_url": "https://api.github.com/repos/octocat/Hello-World/notifications{?since,all,participating}",
          "pulls_url": "https://api.github.com/repos/octocat/Hello-World/pulls{/number}",
          "releases_url": "https://api.github.com/repos/octocat/Hello-World/releases{/id}",
          "ssh_url": "git@github.com:octocat/Hello-World.git",
          "stargazers_url": "https://api.github.com/repos/octocat/Hello-World/stargazers",
          "statuses_url": "https://api.github.com/repos/octocat/Hello-World/statuses/{sha}",
          "subscribers_url": "https://api.github.com/repos/octocat/Hello-World/subscribers",
          "subscription_url": "https://api.github.com/repos/octocat/Hello-World/subscription",
          "tags_url": "https://api.github.com/repos/octocat/Hello-World/tags",
          "teams_url": "https://api.github.com/repos/octocat/Hello-World/teams",
          "trees_url": "https://api.github.com/repos/octocat/Hello-World/git/trees{/sha}",
          "clone_url": "https://github.com/octocat/Hello-World.git",
          "mirror_url": "git:git.example.com/octocat/Hello-World",
          "hooks_url": "https://api.github.com/repos/octocat/Hello-World/hooks",
          "svn_url": "https://svn.github.com/octocat/Hello-World",
          "homepage": "https://github.com",
          "language": null,
          "forks_count": 9,
          "stargazers_count": 80,
          "watchers_count": 80,
          "size": 108,
          "default_branch": "master",
          "open_issues_count": 0,
          "is_template": true,
          "topics": [
            "octocat",
            "atom",
            "electron",
            "api"
          ],
          "has_issues": true,
          "has_projects": true,
          "has_wiki": true,
          "has_pages": false,
          "has_downloads": true,
          "archived": false,
          "disabled": false,
          "visibility": "public",
          "pushed_at": "2011-01-26T19:06:43Z",
          "created_at": "2011-01-26T19:01:12Z",
          "updated_at": "2011-01-26T19:14:43Z",
          "permissions": {
            "admin": false,
            "push": false,
            "pull": true
          },
          "allow_rebase_merge": true,
          "template_repository": null,
          "temp_clone_token": "ABTLWHOULUVAXGTRYU7OC2876QJ2O",
          "allow_squash_merge": true,
          "allow_auto_merge": false,
          "delete_branch_on_merge": true,
          "allow_merge_commit": true,
          "subscribers_count": 42,
          "network_count": 0,
          "license": {
            "key": "mit",
            "name": "MIT License",
            "url": "https://api.github.com/licenses/mit",
            "spdx_id": "MIT",
            "node_id": "MDc6TGljZW5zZW1pdA==",
            "html_url": "https://github.com/licenses/mit"
          },
          "forks": 1,
          "open_issues": 1,
          "watchers": 1
        }
      },
      "base": {
        "label": "octocat:master",
        "ref": "master",
        "sha": "6dcb09b5b57875f334f61aebed695e2e4193db5e",
        "user": {
          "login": "octocat",
          "id": 1,
          "node_id": "MDQ6VXNlcjE=",
          "avatar_url": "https://github.com/images/error/octocat_happy.gif",
          "gravatar_id": "",
          "url": "https://api.github.com/users/octocat",
          "html_url": "https://github.com/octocat",
          "followers_url": "https://api.github.com/users/octocat/followers",
          "following_url": "https://api.github.com/users/octocat/following{/other_user}",
          "gists_url": "https://api.github.com/users/octocat/gists{/gist_id}",
          "starred_url": "https://api.github.com/users/octocat/starred{/owner}{/repo}",
          "subscriptions_url": "https://api.github.com/users/octocat/subscriptions",
          "organizations_url": "https://api.github.com/users/octocat/orgs",
          "repos_url": "https://api.github.com/users/octocat/repos",
          "events_url": "https://api.github.com/users/octocat/events{/privacy}",
          "received_events_url": "https://api.github.com/users/octocat/received_events",
          "type": "User",
          "site_admin": false
        },
        "repo": {
          "id": 1296269,
          "node_id": "MDEwOlJlcG9zaXRvcnkxMjk2MjY5",
          "name": "Hello-World",
          "full_name": "octocat/Hello-World",
          "owner": {
            "login": "octocat",
            "id": 1,
            "node_id": "MDQ6VXNlcjE=",
            "avatar_url": "https://github.com/images/error/octocat_happy.gif",
            "gravatar_id": "",
            "url": "https://api.github.com/users/octocat",
            "html_url": "https://github.com/octocat",
            "followers_url": "https://api.github.com/users/octocat/followers",
            "following_url": "https://api.github.com/users/octocat/following{/other_user}",
            "gists_url": "https://api.github.com/users/octocat/gists{/gist_id}",
            "starred_url": "https://api.github.com/users/octocat/starred{/owner}{/repo}",
            "subscriptions_url": "https://api.github.com/users/octocat/subscriptions",
            "organizations_url": "https://api.github.com/users/octocat/orgs",
            "repos_url": "https://api.github.com/users/octocat/repos",
            "events_url": "https://api.github.com/users/octocat/events{/privacy}",
            "received_events_url": "https://api.github.com/users/octocat/received_events",
            "type": "User",
            "site_admin": false
          },
          "private": false,
          "html_url": "https://github.com/octocat/Hello-World",
          "description": "This your first repo!",
          "fork": false,
          "url": "https://api.github.com/repos/octocat/Hello-World",
          "archive_url": "https://api.github.com/repos/octocat/Hello-World/{archive_format}{/ref}",
          "assignees_url": "https://api.github.com/repos/octocat/Hello-World/assignees{/user}",
          "blobs_url": "https://api.github.com/repos/octocat/Hello-World/git/blobs{/sha}",
          "branches_url": "https://api.github.com/repos/octocat/Hello-World/branches{/branch}",
          "collaborators_url": "https://api.github.com/repos/octocat/Hello-World/collaborators{/collaborator}",
          "comments_url": "https://api.github.com/repos/octocat/Hello-World/comments{/number}",
          "commits_url": "https://api.github.com/repos/octocat/Hello-World/commits{/sha}",
          "compare_url": "https://api.github.com/repos/octocat/Hello-World/compare/{base}...{head}",
          "contents_url": "https://api.github.com/repos/octocat/Hello-World/contents/{+path}",
          "contributors_url": "https://api.github.com/repos/octocat/Hello-World/contributors",
          "deployments_url": "https://api.github.com/repos/octocat/Hello-World/deployments",
          "downloads_url": "https://api.github.com/repos/octocat/Hello-World/downloads",
          "events_url": "https://api.github.com/repos/octocat/Hello-World/events",
          "forks_url": "https://api.github.com/repos/octocat/Hello-World/forks",
          "git_commits_url": "https://api.github.com/repos/octocat/Hello-World/git/commits{/sha}",
          "git_refs_url": "https://api.github.com/repos/octocat/Hello-World/git/refs{/sha}",
          "git_tags_url": "https://api.github.com/repos/octocat/Hello-World/git/tags{/sha}",
          "git_url": "git:github.com/octocat/Hello-World.git",
          "issue_comment_url": "https://api.github.com/repos/octocat/Hello-World/issues/comments{/number}",
          "issue_events_url": "https://api.github.com/repos/octocat/Hello-World/issues/events{/number}",
          "issues_url": "https://api.github.com/repos/octocat/Hello-World/issues{/number}",
          "keys_url": "https://api.github.com/repos/octocat/Hello-World/keys{/key_id}",
          "labels_url": "https://api.github.com/repos/octocat/Hello-World/labels{/name}",
          "languages_url": "https://api.github.com/repos/octocat/Hello-World/languages",
          "merges_url": "https://api.github.com/repos/octocat/Hello-World/merges",
          "milestones_url": "https://api.github.com/repos/octocat/Hello-World/milestones{/number}",
          "notifications_url": "https://api.github.com/repos/octocat/Hello-World/notifications{?since,all,participating}",
          "pulls_url": "https://api.github.com/repos/octocat/Hello-World/pulls{/number}",
          "releases_url": "https://api.github.com/repos/octocat/Hello-World/releases{/id}",
          "ssh_url": "git@github.com:octocat/Hello-World.git",
          "stargazers_url": "https://api.github.com/repos/octocat/Hello-World/stargazers",
          "statuses_url": "https://api.github.com/repos/octocat/Hello-World/statuses/{sha}",
          "subscribers_url": "https://api.github.com/repos/octocat/Hello-World/subscribers",
          "subscription_url": "https://api.github.com/repos/octocat/Hello-World/subscription",
          "tags_url": "https://api.github.com/repos/octocat/Hello-World/tags",
          "teams_url": "https://api.github.com/repos/octocat/Hello-World/teams",
          "trees_url": "https://api.github.com/repos/octocat/Hello-World/git/trees{/sha}",
          "clone_url": "https://github.com/octocat/Hello-World.git",
          "mirror_url": "git:git.example.com/octocat/Hello-World",
          "hooks_url": "https://api.github.com/repos/octocat/Hello-World/hooks",
          "svn_url": "https://svn.github.com/octocat/Hello-World",
          "homepage": "https://github.com",
          "language": null,
          "forks_count": 9,
          "stargazers_count": 80,
          "watchers_count": 80,
          "size": 108,
          "default_branch": "master",
          "open_issues_count": 0,
          "is_template": true,
          "topics": [
            "octocat",
            "atom",
            "electron",
            "api"
          ],
          "has_issues": true,
          "has_projects": true,
          "has_wiki": true,
          "has_pages": false,
          "has_downloads": true,
          "archived": false,
          "disabled": false,
          "visibility": "public",
          "pushed_at": "2011-01-26T19:06:43Z",
          "created_at": "2011-01-26T19:01:12Z",
          "updated_at": "2011-01-26T19:14:43Z",
          "permissions": {
            "admin": false,
            "push": false,
            "pull": true
          },
          "allow_rebase_merge": true,
          "template_repository": null,
          "temp_clone_token": "ABTLWHOULUVAXGTRYU7OC2876QJ2O",
          "allow_squash_merge": true,
          "allow_auto_merge": false,
          "delete_branch_on_merge": true,
          "allow_merge_commit": true,
          "subscribers_count": 42,
          "network_count": 0,
          "license": {
            "key": "mit",
            "name": "MIT License",
            "url": "https://api.github.com/licenses/mit",
            "spdx_id": "MIT",
            "node_id": "MDc6TGljZW5zZW1pdA==",
            "html_url": "https://github.com/licenses/mit"
          },
          "forks": 1,
          "open_issues": 1,
          "watchers": 1
        }
      },
      "_links": {
        "self": {
          "href": "https://api.github.com/repos/octocat/Hello-World/pulls/1347"
        },
        "html": {
          "href": "https://github.com/octocat/Hello-World/pull/1347"
        },
        "issue": {
          "href": "https://api.github.com/repos/octocat/Hello-World/issues/1347"
        },
        "comments": {
          "href": "https://api.github.com/repos/octocat/Hello-World/issues/1347/comments"
        },
        "review_comments": {
          "href": "https://api.github.com/repos/octocat/Hello-World/pulls/1347/comments"
        },
        "review_comment": {
          "href": "https://api.github.com/repos/octocat/Hello-World/pulls/comments{/number}"
        },
        "commits": {
          "href": "https://api.github.com/repos/octocat/Hello-World/pulls/1347/commits"
        },
        "statuses": {
          "href": "https://api.github.com/repos/octocat/Hello-World/statuses/6dcb09b5b57875f334f61aebed695e2e4193db5e"
        }
      },
      "author_association": "OWNER",
      "auto_merge": null,
      "draft": false
    }
  ]