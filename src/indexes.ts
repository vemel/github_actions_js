export const JS_INDEX_URL =
    "https://github.com/vemel/github_actions_js/tree/main/nodejs_workflows";

export interface IIndex {
    url: string;
    title: string;
    shortcut: string;
}

export const INDEXES: Array<IIndex> = [
    {
        url: JS_INDEX_URL,
        title: "Node.js",
        shortcut: "node"
    },
    {
        url:
            "https://github.com/vemel/github_actions_js/tree/main/python_workflows",
        title: "Python",
        shortcut: "python"
    },
    {
        url:
            "https://github.com/actions-rs/example/tree/master/.github/workflows",
        title: "Rust",
        shortcut: "rust"
    }
];

export function getIndexURL(url: string): string {
    for (const index of INDEXES) {
        if (index.url === url || index.shortcut === url) return index.url;
    }
    return url;
}

export function getIndexResource(url: string): IIndex | null {
    for (const index of INDEXES) {
        if (index.url === url || index.shortcut === url) return index;
    }
    return null;
}

export function getShortcut(url: string): string | null {
    for (const index of INDEXES) {
        if (index.url === url || index.shortcut === url) return index.shortcut;
    }
    return null;
}
