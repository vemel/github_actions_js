export const JS_INDEX_URL =
    "https://github.com/vemel/github_actions_js/tree/{ref}/nodejs_workflows";
export const PY_INDEX_URL =
    "https://github.com/vemel/github_actions_js/tree/{ref}/python_workflows";

interface IIndex {
    url: string;
    shortcut?: string;
}

export const INDEXES: Array<IIndex> = [
    {
        url: JS_INDEX_URL,
        shortcut: "node"
    },
    {
        url: PY_INDEX_URL,
        shortcut: "python"
    }
];

export function getIndexResource(url: string): IIndex {
    const result = INDEXES.find(
        index => index.url === url || index.shortcut === url
    );
    if (result) return result;
    return { url };
}
