# Create and manage your own GitHub Actions pack

## Easy way

- [Fork](https://github.com/vemel/github_actions_js/fork) this repo
- Change files in [workflows](./workflows/) or [py_workflows](./py_workflows/)
- And there you go:

```bash
# install your Node.js workflows
ghactions -i https://raw.githubusercontent.com/yournickname/github_actions_js/{ref}/workflows/index.yml -u all

# install your Python workflows
ghactions -i https://raw.githubusercontent.com/yournickname/github_actions_js/{ref}/py_workflows/index.yml -u all
```

## Start from scratch

Create a folder (e.g. `workflows`) in a public GitHub repository.

Create `workflows/index.yml` file with the following content:

```yaml
name: My own GitHub Actions
workflows:
  - name: label_pull_request
    title: Add motivating labels to opened Pull Requests
    url: ./label_pull_request.yml
```

Create `workflows/label_pull_request.yml`

```yaml
# Motivate our developers
name: Label Pull Request
"on":
  pull_request:
    types:
      - opened
jobs:
  motivate:
    runs-on: ubuntu-latest
    steps:
      - name: Get Pull Request
        uses: actions/github-script@v3
        with:
          github-actions-managed: true
          script: |
            await github.issues.setLabels({
              owner: context.repo.owner,
              repo: context.repo.repo,
              issue_number: context.payload.pull_request.number,
              labels: ['keepon', 'keepingon']
            })
```

Now you can install this action to any project:

```bash
npx i --save-dev github-actions
mkdir -p .github/workflows

GITHUB_OWNER=creator
GITHUB_REPO=my_actions
GITHUB_REF=main

ghactions -i https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/${GITHUB_REF}/workflows/index.yml -u all
```