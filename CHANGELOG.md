# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]
### Added
- `[cli]` `--check` flag to check if workflows are ready for updates
- `[on_Push_check]` can run on multiple Node.js versions

### Changed
- `[cli]` merges changes on update instead of overwrite
- `[cli]` added workflow header with instructions
- `[on_Push_check]` Node.js version changed from 12 to 14
- `[cli]` step can be marked as `github-actions-managed: false` to prevent overwrite on update

### Fixed
- Check if CLI command is started in a GitHub repository root
- `[on_push_check]` `npm run` commands `lint` and `test` were not discovered properly from 3rd party scripts
- `[on_push_check]` cache moved down to avoid installation and caching when there is nothing to do
- `[on_release_pull_merged]` `npm run` commands `build` was not discovered properly from 3rd party scripts
- `[cli]` Clean up temp download directory
- `[all]` fix inputs parameters
