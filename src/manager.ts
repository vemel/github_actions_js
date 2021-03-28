import download from "download";
import fs from "fs";
import yaml from "js-yaml";
import os from "os";
import path from "path";
import { promisify } from "util";

import { LOCAL_WORKFLOWS_PATH, REPO_URL, UTF8 } from "./constants";
import { Workflow } from "./workflow";

function getTempDir(): string {
    return fs.mkdtempSync(path.join(os.tmpdir(), "ghactions-"));
}

export function getLocalPath(name: string): string {
    return path.join(LOCAL_WORKFLOWS_PATH, `${name}.yml`);
}

export function updateWorkflow(name: string, content: string): void {
    fs.writeFileSync(getLocalPath(name), content, { encoding: UTF8 });
}

export function getWorkflowData(content: string): Workflow {
    return <Workflow>yaml.load(content);
}

export function renderWorkflow(
    workflow: Workflow,
    commentLines: Array<string>
): string {
    const body = yaml.dump(workflow, {
        lineWidth: 999,
        quotingType: '"'
    });
    const header = commentLines
        .map(line => (line.length ? `# ${line}` : "#"))
        .join("\n");
    if (header.length) return `${header}\n\n${body}`;
    return body;
}

export function getRemoteURL(name: string, ref: string, path: string): string {
    return `${REPO_URL}/${ref}/${path}/${name}.yml`;
}

export function getTopCommentLines(content: string): Array<string> {
    return content
        .split(/\r?\n/)
        .filter(line => line.startsWith("#"))
        .map(line => line.substr(1).trim());
}

export async function readRemoteWorkflows(
    names: Array<string>,
    ref: string,
    remotePath: string
): Promise<Array<[string, string | null]>> {
    const tempPath = getTempDir();
    const results: Array<Promise<[string, string | null]>> = names.map(
        async name => {
            const filePath = path.join(tempPath, `${name}.yml`);
            const url = getRemoteURL(name, ref, remotePath);
            try {
                await download(url, tempPath);
            } catch (e) {
                return <[string, null]>[name, null];
            }
            const content = await promisify(fs.readFile)(filePath, {
                encoding: UTF8
            });
            return <[string, string]>[name, content];
        }
    );
    return Promise.all(results).then(async data => {
        await promisify(fs.rmdir)(tempPath, { recursive: true });
        return data;
    });
}

export async function readLocalWorkflows(
    names: Array<string>
): Promise<Array<[string, string | null]>> {
    const results: Array<Promise<[string, string | null]>> = names.map(
        async name => {
            const filePath = getLocalPath(name);
            try {
                const content = await promisify(fs.readFile)(filePath, {
                    encoding: UTF8
                });
                return <[string, string]>[name, content];
            } catch {
                return <[string, null]>[name, null];
            }
        }
    );
    return Promise.all(results);
}
