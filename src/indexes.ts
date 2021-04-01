import fs from "fs";
import path from "path";

export class IndexResource {
    name: string;
    url: string;
    id: string;
    markerFilePath: string | null;
    constructor(
        name: string,
        url: string,
        id: string,
        markerFilePath?: string
    ) {
        this.name = name;
        this.url = url;
        this.id = id;
        this.markerFilePath = markerFilePath || null;
    }

    markerFileExists(localPath: string): boolean {
        if (!this.markerFilePath) return false;
        return fs.existsSync(path.join(localPath, this.markerFilePath));
    }
}

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
