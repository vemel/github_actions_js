# GitHub Actions Manager

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
  - [Usage](#usage)
  - [Automated automation?](#automated-automation)
  - [Version 1.0.0 checklist](#version-100-checklist)

## Usage

```bash
# in a GitHub repository root
npm i --save-dev github-actions
mkdir -p .github/workflows

# check if actions can be installed or updated
npx ghactions --check

# add or update all workflows for Node.js projects
npx ghactions all

# for Python projects use
npx ghactions_py all
```

## Automated automation?

Yes, why not! Even small projects nowadays have at least simple CI/CD to enforce best practices
or just to avoid boring release management. Thanks to [GitHub Actions](https://github.com/features/actions),
it is super easy to kickstart an automation for a new project in minutes.

However, every project CI/CD has to be set up and updated separately, even though they have a lot in common.
So, instead of making our life easier, CI/CD just adds a new folder in project to keep an eye on.

But imagine, what if...

What if we could manage our GitHub Actions the same way we manage npm dependencies?
What if we could adapt CI/CD for different projects to our needs and still keep them in sync?
What if we could share best CI/CD practices and collaborate to raise the bar even higher?
And finally, what if we could adapt these best practices for a new project with a single command?

Let's start today:
- CI/CD for Node.js projects [installation guide](./workflows/README.md)
- CI/CD for Python projects [installation guide](./workflows_py/README.md)
- Create and manage your own Actions pack [guide](./CUSTOM.md)

## Version 1.0.0 checklist

- [x] Unify `--check` and `update` reports
- [x] Support user top comment in workflows
- [x] Add custom indexes support
- [x] Add `--list` argument to list workflows in index
- [ ] external `scripts` support
- [ ] Add `latest` ref support
- [ ] Use `latest` tag for updates by default instead of `main`
