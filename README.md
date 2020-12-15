# github-release-tools

A collection of scripts and tools for semi-automating git- and GitHub-based
release processes.

## Installation

```
npm install -g @mapbox/github-release-tools
```

## Configuration

Create a [personal Github access token](https://help.github.com/articles/creating-a-personal-access-token-for-the-command-line/) and set the value to the `GITHUB_TOKEN` environment variable.

## `backport`

```
backport <change> <branch>

Backports change(s) in a PR to a release branch and opens a pull request for
review.

<change> can be one of the following:

* A commit hash
* The URL to a pull request
* The ID of a pull request, preceded by a hash sign, e.g. #893

<branch> is the name of a release branch, e.g. `release-boba`.

backport will do the following:

1. In the case where <change> is a commit hash, locate the PR in which the
change originated.
2. Create a branch named cherry-pick-<pr>, where <pr> is the ID of the
originating PR.
3. Cherry pick each commit in the originating PR onto this branch, with an
opportunity to resolve conflicts should they arise.
4. Open a PR requesting a merge of cherry-pick-<pr> to <branch>, with a
description that notes the originating PR and reproduces its description.
5. Request a review from the reviewer(s) of the original PR.


Options:
  --version  Show version number                                       [boolean]
  --help     Show help                                                 [boolean]
```

## `changelog-draft`

```
changelog-draft

Generate a draft changelog entry using changes to the default branch since the most recent
release. This is done by scanning pull request descriptions for content between
<changelog></changelog> tags. Below is an example of this format:

`<changelog>Fixes an issue where something would crash.</changelog>`

In addition, if a pull request is labeled with the following tags, the changelog entry 
will fall under a markdown header associated with that tag's name:

• breaking change
• bug
• feature
• docs
• performance
• workflow
• testing
• skip changelog

Note: Pull requests with the "skip changelog" tag will not be included in 
the generated changelog output.

Options:
  --help          Show help                                            [boolean]
  --version       Show version number                                  [boolean]
  -b, --branch    the branch from which this release is being made
                                                      [string] [default: "main"]
  -p, --previous  the previous release; defaults to the most recent vX.Y.Z tag
                                                                        [string]
  -f, --format    output format          [choices: "md", "json"] [default: "md"]
  -r, --repo      the github repository, in "owner/repository" form. Defaults to
                  the repository found in the current directory.        [string]
  -o, --output    the output file                                       [string]
```

## `branch-permissions`

```
branch-permissions <target> [source]

Copies branch protection permissions from one branch to another.


Positionals:
  target  Branch to copy permissions to                                 [string]
  source  Branch to copy permissions from             [string] [default: "main"]

Options:
  --version  Show version number                                       [boolean]
  --help     Show help                                                 [boolean]
```
