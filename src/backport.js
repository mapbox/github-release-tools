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

    execSync(`git branch --no-track backport-${number} origin/${branch}`);
    execSync(`git checkout backport-${number}`);
    execSync(`git am`, {input: prPatch});
    execSync(`git push origin --set-upstream backport-${number}`);

    const result = (await octokit.pullRequests.create({
        owner,
        repo,
        title: `${branch} backport: ${prData.title}`,
        head: `backport-${number}`,
        base: branch,
        body: `Backports #${number} to ${branch}\n----\n${prData.body}`
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
