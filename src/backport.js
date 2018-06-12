const parse = require('parse-github-url');
const octokit = require('@octokit/rest')();
const {execSync} = require('child_process');

module.exports = async function ({change, branch}) {
    octokit.authenticate({
        type: 'token',
        token: process.env.GITHUB_TOKEN
    });

    const {owner, name: repo, filepath: number} = parse(change);

    const prData = (await octokit.pullRequests.get({owner, repo, number})).data;
    const prReviews = (await octokit.pullRequests.getReviews({owner, repo, number})).data;
    const prPatch = (await octokit.pullRequests.get({owner, repo, number, headers: {accept: 'application/vnd.github.v3.patch'}})).data;
    const prSlug = branch.replace(/^release-/, '');
    const prBranch = `backport-${prSlug}-${number}-${prData.head.ref}`;

    execSync(`git branch --no-track ${prBranch} origin/${branch}`);
    execSync(`git checkout ${prBranch}`);
    execSync(`git am`, {input: prPatch});
    execSync(`git push origin --set-upstream ${prBranch}`);

    const result = (await octokit.pullRequests.create({
        owner,
        repo,
        title: `${prSlug} backport: ${prData.title}`,
        head: prBranch,
        base: branch,
        body: `Backports #${number} to [\`${branch}\`](https://github.com/${owner}/${repo}/tree/${branch})\n\n---\n\n${prData.body}`
    })).data;

    await octokit.pullRequests.createReviewRequest({
        owner,
        repo,
        number: result.number,
        reviewers: prReviews
            .filter(({state}) => state === 'APPROVED')
            .map(({user}) => user.login)
    });

    console.log(result.html_url);
};
