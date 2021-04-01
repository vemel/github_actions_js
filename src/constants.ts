export const LOCAL_WORKFLOWS_PATH = "./.github/workflows";
export const UTF8 = "utf-8";

export const DOCS_URL = "https://github.com/vemel/github_actions_js";
export const REPO_URL =
    "https://raw.githubusercontent.com/vemel/github_actions_js";
export const JS_INDEX_URL = `${REPO_URL}/{ref}/workflows/index.yml`;
export const PY_INDEX_URL = `${REPO_URL}/{ref}/workflows_py/index.yml`;

export const INDEXES = [
    { name: "GitHub Actions for Node.js projects", url: JS_INDEX_URL },
    { name: "GitHub Actions for Python projects", url: PY_INDEX_URL }
];
