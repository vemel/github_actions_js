# GitHub Actions Manager

[![npm](https://img.shields.io/npm/v/github-actions?color=blue&label=github-actions&style=flat-square)](https://www.npmjs.com/package/github-actions)
![Codecov](https://img.shields.io/codecov/c/github/vemel/github_actions_js?style=flat-square)
![npm type definitions](https://img.shields.io/npm/types/github-actions?style=flat-square)

> -- Who will test our unit tests?
>
> -- I have no idea 🤨
>
> -- Okay, who will automate our automation?
>
> -- GitHub Actions Manager 😎

Nice and a bit shy CLI tool to install and update [GitHub Actions](https://github.com/features/actions).

Comes with awesome packs for [Node.js](./workflows/README.md) and [Python](./workflows_py/README.md) projects.

- [GitHub Actions Manager](#github-actions-manager)
  - [Basic usage](#basic-usage)
  - [Automated automation?](#automated-automation)
  - [Advanced usage](#advanced-usage)
    - [Simple, no-force update](#simple-no-force-update)
    - [Force update](#force-update)
    - [CLI arguments](#cli-arguments)
  - [Example](#example)
  - [Version 1.0.0 checklist](#version-100-checklist)

## Basic usage

```bash
# in a GitHub repository root
npm i --save-dev github-actions

# run interactive manager
npx ghactions

# or check how to run non-interactively
npx ghactions --help
```

## Automated automation?

Yes, why not! Even small projects nowadays have at least simple CI/CD to enforce best practices
or just to avoid boring release management. Thanks to [GitHub Actions](https://github.com/features/actions),
it is super easy to kickstart an automation for a new project in minutes.

However, every project CI/CD has to be set up and updated separately, even though they have a lot in common.
So, instead of making our life easier, CI/CD just adds a new folder in project to keep an eye on.

But imagine, what if we could ...

- manage our GitHub Actions the same way we manage npm dependencies
- adapt CI/CD for different projects to our needs and still keep them in sync
- share the best CI/CD practices and collaborate to raise the bar even higher

And finally, what if we could add these best practices for a new project with a single command.

Let's start today:
- CI/CD for Node.js projects [installation guide](./workflows/README.md)
- CI/CD for Python projects [installation guide](./workflows_py/README.md)
- Create and manage your own Actions pack [guide](./CUSTOM.md)

## Advanced usage

### Simple, no-force update

- `job.*.steps` that are `github-actions-managed` are updated from remote or removed if they do not exist remotely
- `job.*.steps` that are not `github-actions-managed` are kept untouched and preserve their position in workflow
- `job.*.steps` that exist only remotely are added to workflow to correct position, so to remove step, make in not managed and run empty `run` command to it, keep `id` the same.

### Force update

- Top comment in YAML file is replaced with remote
- `name` workflow name is replaced with remote
- `on` triggers are replaced with remote
- `jobs.*.env` is replaced with remote
- `jobs.*.strategy` is replaced with remote
- `jobs.*.runs-on` is replaced with remote
- `jobs.*.if` is replaced with remote

### CLI arguments

| Short | Long | Default | Description |
| - | - | - | - |
| `-n <name>[ <name>]*` | `--names <name>[ <name>]*` | interactive mode | Workflow name `<name>.yml`, `all`, or `installed` |
| `-r <version>` | `--ref <version>` | `main` | Update workflows to a specific tag/branch |
| `-i <url>` | `--index <url>` | `node`/`python`/`<url>` | Link to workflows index YAML file, supports `{ref}` placeholder |
| `-p <path>` | `--path <path>` | `.github/workflows` | Path to workflows |
| `-u` | `--update` | | Apply suggested changes |
| `-f` | `--force` | | Update user-managed workflow parts |
| `-l` | `--list` | | List available workflows |
| `-d` | `--diff` | | Show diff for update and check runs |
| `-h` | `--help` | | Print this usage guide |
| `-v` | `--version` | | Show package version |

## Example

We want to announce all pushes to our repos to our Slack, so let's create
a workflow template in our index repository:

```yaml
name: Send Slack message on push
"on":
  push: {}
jobs:
  slack-message:
    runs-on: ubuntu:latest
    env:
      PROJECT_NAME: some project
    steps:
      - name: Checkout current branch
        id: checkout
        uses: actions/checkout@v1
      - name: Collect changes
        id: changes
        run: |
          const collector = require('./collector')
          core.setOutput('result', collector.collect());
      - name: Send Slack message
        id: message
        run: |
          CHANGES=${{ toJSON(steps.changes.outputs.result) }}
          MESSAGE="We have just updated our ${PROJECT_NAME}! ${CHANGES}"
          curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"${MESSAGE}\"}" \
            ${{ secrets.SLACK_WEBHOOK }}
```

Okay, now we install it to any project with `ghactions -i ${INDEX_URL} -u all`
We can change `PROJECT_NAME` env variable for every project to correctly show what project it was.

In a project we will have something like this after modification (except for comments)

```yaml
name: Send Slack message on push
"on":
  push: {}
jobs:
  slack-message:
    runs-on: ubuntu:latest
    env:
      PROJECT_NAME: awesomelib # we changed project name
    steps:
       # notice github-actions-managed line here
      - name: Checkout current branch
        id: checkout
        uses: actions/checkout@v1
        with:
          github-actions-managed: true
      # and in this step
      # these lines mean that these steps can be updated wuth ghactions -i ${INDEX_URL} -u all
      # if these steps were changed remotely
      - name: Collect changes
        id: changes
        run: |
            # github-actions-managed: true
          const collector = require('./collector')
          core.setOutput('result', collector.collect());
      - name: Send Slack message
        id: message
        # if you want steps to survive updates, remove this line or set to false
        run: |
            # github-actions-managed: false
            # ^^ cool, this step will not be affected by updates even if it has been changed remotely
            CHANGES=${{ toJSON(steps.changes.outputs.result) }}
            MESSAGE="We have just updated our ${PROJECT_NAME}! ${CHANGES}"
            curl -X POST -H 'Content-type: application/json' \
              --data "{\"text\":\"${MESSAGE}\"}" \
              ${{ secrets.SLACK_WEBHOOK }}
      - name: Extra step
        run: |
          echo "This step is local-only, so updates do not touch it"
```

And if there are remote changes other than steps that we want to apply, we can use `--force` flag.

## Version 1.0.0 checklist
- [x] Unify `check` and `update` reports
- [x] Support user top comment in workflows
- [x] Add custom indexes support
- [x] Add `--list` argument to list workflows in index
- [x] Add `--path` argument to allow running not for a repository root
- [x] Smart diff
- [x] Interactive CLI
- [ ] External `scripts` support
