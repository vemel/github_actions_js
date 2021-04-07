# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.9.0]
### Added
- Workflows for [Rust](https://github.com/actions-rs/example) projects
- Workflows for [Go](https://github.com/mvdan/github-actions-golang) projects
- Workflows for [Terraform](https://github.com/dflook/terraform-github-actions) projects
- Workflows for [Julia](https://github.com/julia-actions/Example.jl) projects
- Multiple jobs in one workflow support
- Autocomplete repository root GitHub URLs with `/tree/master/.github/workflows`

### Fixed
- Suggested `--force` updates were not showing step/job names correctly
- Stored indexes are trimmed to the last 20 used
- Steps with the same data are considered the same
- Steps diff for added/removed steps was incorrect
- Accept `*.yaml` files as workflows
- Mark manually added items in interactive mode

## [0.8.0]
### Added
- Support `file:///` protocol for index URL
- Support any GitHub repositories as index
- Interactive mode allows to choose GitHub repo
- Interactive mode allows to choose local directory

### Fixed
- Custom indexes were not usable in interactive mode
- Temporary downloads clean up on error
- Added workflows were not listed as changed
- Steps are discovered by `id`, `name`, then `uses`
- Ref replace can be applied to any GitHub URLs

## [0.7.0]
### Added
- `--clean` CLI flag to create workflows without `github-actions-script` marker
- `--diff` and `--force` flags can be set during interactive run
- Indexes can list env variables used in workflows

### Fixed
- Workflows are downloaded in parallel
- Avoid loading resources two times in interactive mode
- Check mode shows a correct command to apply update
- Workflows were created with non-managed steps sometimes
- `job.*.steps.[].with.github-actions-script` moved to the first position to be more visible
- Show non-managed steps diff correctly
- Support `--list` flag in interactive mode

## [0.6.2]
### Fixed
- Incorrect Javascript imports

## [0.6.1]
### Fixed
- Comment lines are not trimmed on update

## [0.6.0]
### Added
- Interactive run when no `--names` are specified
- Index can be selected with a short id: `-i node`, `-i python`
- Index `documentation` field that contains a documentation URL
- Index `workflows.[].secrets` field with a list of secrets used in workflow

### Changed
- `--names existing` replaced with `--names installed`
- Workflow comment is populated from description in index

### Fixed
- Handle invalid user YAML in workflow

## [0.6.0-rc.1]
### Added
- Interactive run when no `--names` are specified
- Index can be selected with a short id: `-i node`, `-i python`
- Index `documentation` field that contains a documentation URL
- Index `workflows.[].secrets` field with a list of secrets used in workflow

### Changed
- `--names existing` replaced with `--names installed`
- Workflow comment is populated from description in index

### Fixed
- Handle invalid YAML error in workflow

## [0.5.0]
### Added
- `--path` CLI argument to specify local path to workflows
- `--update` CLI argument to create/update workflows

### Changed
- Sync `jobs.*.strategy` from remote with `--force`
- Logs cleaned up
- `--update` CLI argument renamed to `--names`
- `--diff` is shown for each change separately

### Fixed
- `--version` reports a correct version
- `--diff` shows changes between local and updated version instead of remote
- Removed extra empty line in renedered workflows
- Support basicauth in index URL

## [0.4.0]
### Added
- `--version` CLI flag to show package version
- `--diff` CLI flag to output diff on check/update

### Changed
- sync `jobs.*.runs-on` from remote with `--force`
- sync `jobs.*.env` from remote with `--force`
- `[on_push_check.py]` run `pylint`, `flake8`, `pytest`, `mypy`, `pyright` if available

### Fixed
- `[on_push_check.js]` move script names to `env` for easier changing

## [0.3.0]
### Added
- `[cli]` `--index` argument to support custom action packs
- `[cli]` `--list` argument to list available actions

### Changed
- `[cli]` removed hardcoded workflow names
- `[cli]` remote workflow steps are always marked as managed

### Fixed
- `[on_release_published.py]` uses `setup.cfg` file as a source of truth for version
- `[on_pull_opened_or_edited]` is triggered on Pull Request ropen as well
- `[on_release_published]` assigns labels to created Pull Request
- `[on_demand_create_release_draft]` sets `release.is_prerelease` flag correctly
- `[on_pull_merged]` sets `release.is_prerelease` flag correctly

## [0.2.0]
### Added
- `[cli]` Workflow top comment can be changed by user, overwrite with `--force` flag
- `[cli]` massive logging facelift, cleaner changes description
- `[cli]` `--check` can be combined with `--force` flag to check force update result
- `[cli]` `// github-actions-managed: false` can be added to `with.script` lines to prevent step update

### Changed
- `[cli]` update does not apply if workflow has errors
- `[cli]` check fails if workflows has duplicated step ids

### Fixed
- `[cli]` show correct `ghactions_py` command in output for Python projects
- `[on_push_check]` install latest `npm` before package installation
- `[on_push_check]` use `npm ci` instead of `npm install`
- `[on_release_pull_merged]` install latest `npm` before package installation
- `[on_release_pull_merged]` fix gettng inputs for manual run
- `[on_release_pull_merged]` use `npm ci` instead of `npm install`
- `[on_release_published]` fix getting inputs for manual run

## [0.1.0]
### Added
- `[cli]` `--check` flag to check if workflows are ready for updates
- `[on_Push_check]` can run on multiple Node.js versions
- `[cli]` `ghactions_py` command to generate Python workflows

### Changed
- `[cli]` merges changes on update instead of overwrite
- `[cli]` added workflow header with instructions
- `[on_Push_check]` Node.js version changed from 12 to 14
- `[cli]` step can be marked as `github-actions-managed: false` to prevent overwrite on update
- `[on_demand_create_release_draft]` removed `target` input, base branch is extracted from `ref`

### Fixed
- Check if CLI command is started in a GitHub repository root
- `[on_push_check]` `npm run` commands `lint` and `test` were not discovered properly from 3rd party scripts
- `[on_push_check]` cache moved down to avoid installation and caching when there is nothing to do
- `[on_release_pull_merged]` `npm run` commands `build` was not discovered properly from 3rd party scripts
- `[cli]` Clean up temp download directory
- `[all]` fix inputs parameters
