# github-release-tools

A collection of scripts and tools for semi-automating git- and GitHub-based
release processes.

## Installation

```
npm install -g @mapbox/github-release-tools
```

## `changelog-draft`

```
changelog-draft [options] -o changelog-draft.md

Generate a draft changelog entry using changes to master since the most recent
release.

Options:
  --help          Show help                                            [boolean]
  --version       Show version number                                  [boolean]
  -b, --branch    the branch from which this release is being made
                                                    [string] [default: "master"]
  -p, --previous  the previous release; defaults to the most recent vX.Y.Z tag
                                                                        [string]
  -f, --format    output format          [choices: "md", "json"] [default: "md"]
  -r, --repo      the github repository, in "owner/repository"
                                       [string] [default: "mapbox/mapbox-gl-js"]
  -o, --output    the output file                                       [string]
```

