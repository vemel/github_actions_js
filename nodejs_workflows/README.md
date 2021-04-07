# GitHub Actions Manager

- [GitHub Actions Manager](#github-actions-manager)
  - [Installation](#installation)
  - [How to use](#how-to-use)
  - [Zen](#zen)
  - [Secrets](#secrets)
  - [Available workflows](#available-workflows)
    - [Run style checks and unit tests](#run-style-checks-and-unit-tests)
    - [Update Pull Request labels](#update-pull-request-labels)
    - [Update Release from Pull Request](#update-release-from-pull-request)
    - [Create Release Pull Request](#create-release-pull-request)
    - [Publish to NPM](#publish-to-npm)
    - [Create Release draft](#create-release-draft)

## Installation

```bash
# install globally or locally
npm i -g github-actions
# npm i --save-dev github-actions

# run interactive manager
# in a GitHub repository root
ghactions -i node
```

Index: [index.yml](./index.yml)

## How to use
- Set 'github-actions-managed' to false on manual edit to prevent step overwrite on update
- User-added steps survive update as well
- Deleted steps are restored on update, so make them empty instead of removing

## Zen
- Enforce best practices for versioning and changelog in a passive-aggressive way
- Write Release and Pull Request notes in [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) format
- Follow [SemVer](https://semver.org/) versioning schema
- Noone likes to write and assemble Release notes, so leave it to automation
- Always leave a final decision to a human in case automation goes crazy
- All actions use only Node.js 12 for speed and stability
- Every action should have an additional manual trigger in case of trouble
- Full compatibility with [nektos/act](https://github.com/nektos/act) for local execution
- Do not try to build one-fits-all soultion, provide customization instead

## Secrets
- `CODECOV_TOKEN` - Token for https://codecov.io/ coverage report
- `GPG_PRIVATE_KEY` - Key to sign commits https://docs.github.com/en/github/authenticating-to-github/generating-a-new-gpg-key
- `GPG_PRIVATE_KEY_PASSPHRASE` - Passphrase for GPG private key
- `NPM_TOKEN` - Token for npm publishing https://docs.npmjs.com/creating-and-viewing-access-tokens

## Available workflows
### Run style checks and unit tests
Workflow: [on_push_check.yml](./on_push_check.yml)

```bash
# install this action to .github/workflows
ghactions -i node -u on_push_check
```

- Starts on push to any branch
- Uses `npm` cache to improve performance
- Runs linting if `lint` script is available in `npm run`
- Runs unit tests if `test` script is available in `npm run`
- Runs `test-cov` script if it is available in `npm run`
- Sends test coverage report to https://codecov.io/ if `CODECOV_TOKEN` secret is set

**Environment**

- `LINT_SCRIPT` - npm run script to run for code style check if available (default: `lint`)
- `TEST_SCRIPT` - npm run script to run for testing if available (default: `test`)
- `TEST_COVERAGE_SCRIPT` - npm run script to run for test coverage if available (default: `test-cov`)

**Secrets**

- `CODECOV_TOKEN` - Token for https://codecov.io/ coverage report


### Update Pull Request labels
Workflow: [on_pull_opened_or_edited.yml](./on_pull_opened_or_edited.yml)

```bash
# install this action to .github/workflows
ghactions -i node -u on_pull_opened_or_edited
```

- Starts on Pull Request opened or edited event
- Pull Request notes must be in [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) format
- If Pull Request branch name is `release/*`, adds `release` label
- If Pull Request notes has `Removed` section, adds `major` label
- If Pull Request notes has `Added`, `Changed` or `Deprecated` sections, adds `minor` label
- Otherwise adds `patch` label


### Update Release from Pull Request
Workflow: [on_pull_merged.yml](./on_pull_merged.yml)

```bash
# install this action to .github/workflows
ghactions -i node -u on_pull_merged
```

- Starts on Pull Request merge for non-`release/*` branch
- Creates or updates a Release draft for Pull Request base branch
- Release draft notes are merged from existing notes and Pull Request notes
- Each entry added from Pull Request notes contains a link to the Pull Request
- Release draft suggested version is based on Release notes
- Project-agnostic, can be used on any kind of project, change `path: ./package.json` to path to your version file

**Environment**

- `RELEASE_TYPE` - Release suggested version: stable, rc, alpha, beta (default: `rc`)


### Create Release Pull Request
Workflow: [on_release_published.yml](./on_release_published.yml)

```bash
# install this action to .github/workflows
ghactions -i node -u on_release_published
```

- Starts on Release published
- Release notes must be in [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) format
- Creates a Release Pull Request from Release target branch with `release` label
- If the release is not a prerelease, cleans up `Unreleased` section in `CHANGELOG.md`
- Release Pull Request contains only version bump in `package.json` and updated `CHANGELOG.md`
- Release Pull Request uses branch `release/<version>`
- Signs commits if `GPG_PRIVATE_KEY` secret is set

**Secrets**

- `GPG_PRIVATE_KEY` - Key to sign commits https://docs.github.com/en/github/authenticating-to-github/generating-a-new-gpg-key
- `GPG_PRIVATE_KEY_PASSPHRASE` - Passphrase for GPG private key


### Publish to NPM
Workflow: [on_release_pull_merged.yml](./on_release_pull_merged.yml)

```bash
# install this action to .github/workflows
ghactions -i node -u on_release_pull_merged
```

- Runs only if `NPM_TOKEN` secret is set
- Starts on Pull Request merge for `release/*` branch
- Uses Pull Request branch for deployment, so released version contains only changes
  from base branch when Release had been published
- Builds package if `build` script is available in `package.json`
- Publishes new version to [npm](https://www.npmjs.com/)

**Secrets**

- `NPM_TOKEN` - Token for npm publishing https://docs.npmjs.com/creating-and-viewing-access-tokens


### Create Release draft
Workflow: [on_demand_create_release_draft.yml](./on_demand_create_release_draft.yml)

```bash
# install this action to .github/workflows
ghactions -i node -u on_demand_create_release_draft
```

- Starts only manually
- Can be used if you do not enforce Pull Request-based updates and commit directly to `target` branch
- Creates or updates a release draft for `target` branch
- Release notes are populated from `Unreleased` section of `CHANGELOG.md`
- Sets suggested version as `name` and `tag` of the Release
- Project-agnostic, can be used on any kind of project, change `path: ./package.json` to path to your version file
