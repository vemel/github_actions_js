# GitHub Actions for Python projects

- [GitHub Actions for Python projects](#github-actions-for-python-projects)
  - [Installation](#installation)
  - [How to use](#how-to-use)
  - [Zen](#zen)
  - [TODO](#todo)
  - [Secrets](#secrets)
  - [Available workflows](#available-workflows)
    - [Run style checks and unit tests](#run-style-checks-and-unit-tests)
    - [Update Pull Request labels](#update-pull-request-labels)
    - [Update Release from Pull Request](#update-release-from-pull-request)
    - [Create Release Pull Request](#create-release-pull-request)
    - [Publish to PyPI](#publish-to-pypi)
    - [Create Release draft](#create-release-draft)

## Installation

```bash
# install globally
npm i -g github-actions

# run interactive manager
# in a GitHub repository root
ghactions -i python
```

Index: [index.yml](./index.yml)

## How to use
- Set 'github-actions-managed' to false on manual edit to prevent step overwrite on update
- User-added steps survive update as well
- Deleted steps are restored on update, so make them empty instead of removing

## Zen
- Enforce best practices for versioning and changelog in a passive-aggressive way
- Write Release and Pull Request notes in [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) format
- Follow [PEP 440](https://www.python.org/dev/peps/pep-0440/) versioning schema
- Noone likes to write and assemble Release notes, so leave it to automation
- Always leave a final decision to a human in case automation goes crazy
- All actions use only Node.js 12 for speed and stability
- Every action should have an additional manual trigger in case of trouble
- Full compatibility with [nektos/act](https://github.com/nektos/act) for local execution
- Do not try to build one-fits-all soultion, provide customization instead

## TODO
- [ ] Add `pytest-cov` support

## Secrets
- `GPG_PRIVATE_KEY` - Key to sign commits https://docs.github.com/en/github/authenticating-to-github/generating-a-new-gpg-key
- `GPG_PRIVATE_KEY_PASSPHRASE` - Passphrase for GPG private key
- `PYPI_PASSWORD` - Password for `__token__` username for https://pypi.org/

## Available workflows
### Run style checks and unit tests
Workflow: [on_push_check.yml](./on_push_check.yml)

```bash
# install this action to .github/workflows
ghactions -i python -u on_push_check
```

- Starts on push to any branch
- Installs package with `poetry`, `pipenv` or `requirements[-dev].txt`
- Caches installed Python dependencies
- Runs `flake8` if it is installed
- Runs `pylint` if it is installed
- Runs `mypy` if it is installed
- Runs `pyright` if `pyrightconfig.json` file exists
- Runs `pytest` if it is installed


### Update Pull Request labels
Workflow: [on_pull_opened_or_edited.yml](./on_pull_opened_or_edited.yml)

```bash
# install this action to .github/workflows
ghactions -i python -u on_pull_opened_or_edited
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
ghactions -i python -u on_pull_merged
```

- Starts on Pull Request merge for non-`release/*` branch
- Creates or updates a Release draft for Pull Request base branch
- Release draft notes are merged from existing notes and Pull Request notes
- Each entry added from Pull Request notes contains a link to the Pull Request
- Release draft suggested version is based on Release notes

**Environment**

- `RELEASE_TYPE` - Release suggested version: stable, rc, alpha, beta (default: `rc`)


### Create Release Pull Request
Workflow: [on_release_published.yml](./on_release_published.yml)

```bash
# install this action to .github/workflows
ghactions -i python -u on_release_published
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


### Publish to PyPI
Workflow: [on_release_pull_merged.yml](./on_release_pull_merged.yml)

```bash
# install this action to .github/workflows
ghactions -i python -u on_release_pull_merged
```

- Runs only if `PYPI_PASSWORD` secret is set
- Starts on Pull Request merge for `release/*` branch
- Uses Pull Request branch for deployment, so released version contains only changes
  from base branch when Release had been published
- Builds package if `build` script is available in `package.json`
- Publishes new version to [PyPI](https://pypi.org/)

**Secrets**

- `PYPI_PASSWORD` - Password for `__token__` username for https://pypi.org/


### Create Release draft
Workflow: [on_demand_create_release_draft.yml](./on_demand_create_release_draft.yml)

```bash
# install this action to .github/workflows
ghactions -i python -u on_demand_create_release_draft
```

- Starts only manually
- Can be used if you do not enforce Pull Request-based updates and commit directly to `target` branch
- Creates or updates a release draft for `target` branch
- Release notes are populated from `Unreleased` section of `CHANGELOG.md`
- Sets suggested version as `name` and `tag` of the Release
