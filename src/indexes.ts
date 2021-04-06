import IndexResource from "./workflow/indexResource";

export const REPO_URL =
    "https://raw.githubusercontent.com/vemel/github_actions_js";
export const JS_INDEX_URL = `${REPO_URL}/{ref}/workflows/index.yml`;
export const PY_INDEX_URL = `${REPO_URL}/{ref}/workflows_py/index.yml`;

export const INDEXES: Array<IndexResource> = [
    new IndexResource(
        "GitHub Actions for Node.js projects",
        JS_INDEX_URL,
        "node",
        "package.json"
    ),
    new IndexResource(
        "GitHub Actions for Python projects",
        PY_INDEX_URL,
        "python",
        "setup.py"
    )
];

export function getIndexResource(id: string): IndexResource {
    const result = INDEXES.find(index => index.id === id || index.url === id);
    if (!result) return new IndexResource(id, id, id);
    return result;
}
