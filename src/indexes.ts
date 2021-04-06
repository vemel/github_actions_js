export const JS_INDEX_URL =
    "https://github.com/vemel/github_actions_js/tree/main/nodejs_workflows";
export const PY_INDEX_URL =
    "https://github.com/vemel/github_actions_js/tree/main/python_workflows";

export interface IIndex {
    url: string;
    shortcut?: string;
}

export const shortcuts = {
    node: JS_INDEX_URL,
    python: PY_INDEX_URL
};

export const INDEXES: Array<string> = [JS_INDEX_URL, PY_INDEX_URL];

export function getIndexResource(url: string): string {
    if (shortcuts[url]) return shortcuts[url];
    return url;
}

export function getShortcut(url: string): string {
    for (const shortcut of Object.keys(shortcuts)) {
        const shortcutURL = shortcuts[shortcut];
        if (shortcutURL === url) return shortcut;
    }
    return url;
}
