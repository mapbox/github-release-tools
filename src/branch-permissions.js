const parse = require('parse-github-url');
const getRemoteUrl = require('../src/git-remote-url');
const octokit = require('@octokit/rest')();
const {execSync} = require('child_process');

module.exports = async function ({target, source}) {
    const {owner, name: repo} = parse(await getRemoteUrl());

    const token = process.env.GITHUB_TOKEN;
    if (!token) {
        console.error('GITHUB_TOKEN must be set');
        process.exit(1);
    }
    octokit.authenticate({ type: 'token', token });

    const branch = (await octokit.repos.getBranchProtection({ owner, repo, branch: source })).data;

    const result = (await octokit.repos.updateBranchProtection({
        owner,
        repo,
        branch: target,
        required_status_checks: branch.required_status_checks || null,
        enforce_admins: branch.enforce_admins ? branch.enforce_admins.enabled : null,
        required_pull_request_reviews: branch.required_pull_request_reviews || null,
        restrictions: branch.restrictions || null
    })).data;

    console.log(`Copied branch protection permissions from \`${source}\` to \`${target}\``);

    console.log(`\n[%s] Require pull request reviews before merging`, result.required_pull_request_reviews ? 'X' : ' ');
    if (result.required_pull_request_reviews) {
        console.log(`    Require approving reviews: %d`, result.required_pull_request_reviews.required_approving_review_count || 1);
        console.log(`    [%s] Dismiss stale pull request approvals when new commits are pushed`, result.required_pull_request_reviews.dismiss_stale_reviews ? 'X' : ' ');
        console.log(`    [%s] Require review from Code Owners`, result.required_pull_request_reviews.require_code_owner_reviews ? 'X' : ' ');
        console.log(`    [%s] Restrict who can dismiss pull request reviews`, result.required_pull_request_reviews.dismiss_stale_reviews ? 'X' : ' ');
        if (result.required_pull_request_reviews.dismissal_restrictions) {
            console.log(`        Users: %s`, result.required_pull_request_reviews.dismissal_restrictions.users.map(user => user.login).join(', ') || '<none>');
            console.log(`        Teams: %s`, result.required_pull_request_reviews.dismissal_restrictions.teams.map(user => user.slug).join(', ') || '<none>');
        }
    }

    console.log(`\n[%s] Require status checks to pass before merging`, result.required_status_checks ? 'X' : ' ');
    if (result.required_status_checks) {
        console.log(`    [%s] Require status checks to pass before merging`, result.required_status_checks.strict ? 'X' : ' ');
        if (result.required_status_checks.contexts.length) {
            console.log(`    Required status checks:`);
            for (const context of result.required_status_checks.contexts.sort()) {
                console.log(`    - ${context}`);
            }
        }
    }

    console.log(`\n[%s] Include administrators`, (branch.enforce_admins ? branch.enforce_admins.enabled : false) ? 'X' : ' ');

    console.log(`\n[%s] Restrict who can push to matching branches`, branch.restrictions ? 'X' : ' ');
    if (branch.restrictions) {
            console.log(`    Users: %s`, result.restrictions.users.map(user => user.login).join(', ') || '<none>');
            console.log(`    Teams: %s`, result.restrictions.teams.map(user => user.slug).join(', ') || '<none>');
    }
};
