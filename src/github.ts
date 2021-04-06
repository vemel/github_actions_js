import fetch from "node-fetch";
import path from "path";
import { URL } from "url";

async function api(
    hostname: string,
    endpoint: string,
    token?: string
): Promise<unknown> {
    const response = await fetch(`https://api.${hostname}/repos/${endpoint}`, {
        headers: token
            ? {
                  Authorization: `Bearer ${token}`
              }
            : undefined
    });
    const result = await response.json();
    if (result.message === "Not Found") {
        return [];
    }

    if (result.message) {
        throw new Error(result.message);
    }
    return result;
}

interface IFile {
    type: string;
    path: string;
    download_url: string;
}

async function listFiles(
    hostname: string,
    user: string,
    repository: string,
    ref: string,
    directory: string,
    token?: string
): Promise<Array<string>> {
    const contents = (await api(
        hostname,
        `${user}/${repository}/contents/${directory}?ref=${ref}`,
        token
    )) as Array<IFile>;

    return contents
        .filter(item => item.type === "file")
        .filter(item => path.extname(item.path) === ".yml")
        .filter(item => path.basename(item.path) !== "index.yml")
        .map(item => item.download_url);
}

export async function listWorkflowURLs(url: string): Promise<Array<string>> {
    const parsedURL = new URL(url);
    const [, user, repo, , ref, ...directories] = parsedURL.pathname.split("/");
    return await listFiles(
        parsedURL.hostname,
        user,
        repo,
        ref,
        path.join(...directories)
    );
}
