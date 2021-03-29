import download from "download";
import fs from "fs";
import yaml from "js-yaml";
import os from "os";
import path from "path";
import { promisify } from "util";

import { LOCAL_WORKFLOWS_PATH, REPO_URL, UTF8 } from "./constants";
import { joinURL } from "./utils";
import { Workflow, WorkflowIndex, WorkflowIndexItem } from "./workflow";

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
    return yaml.load(content) as Workflow;
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

export async function readWorkflowIndex(
    indexURL: string,
    names: Array<string>
): Promise<WorkflowIndex> {
    const tempPath = getTempDir();
    const downloadPath = path.join(tempPath, "index.yml");
    await download(indexURL, tempPath, { filename: "index.yml" });
    const content = await promisify(fs.readFile)(downloadPath, {
        encoding: "utf-8"
    });
    const data = yaml.load(content) as WorkflowIndex;
    if (names.includes("all")) names = [];
    const result: WorkflowIndex = {
        url: indexURL,
        name: data.name,
        workflows: data.workflows
            .filter(x => names.length === 0 || names.includes(x.name))
            .map(({ name, url }) => {
                if (url.startsWith("./")) {
                    url = joinURL(indexURL, url);
                }
                return {
                    name,
                    url
                };
            })
    };
    const foundNames = data.workflows.map(x => x.name);
    names.forEach(name => {
        if (!foundNames.includes(name))
            throw new Error(
                `workflow ${name} not found, choices are: ${foundNames.join(
                    ", "
                )}`
            );
    });
    return result;
}

export function getTopCommentLines(content: string): Array<string> {
    return content
        .split(/\r?\n/)
        .filter(line => line.startsWith("#"))
        .map(line => line.substr(1).trim());
}

export async function readRemoteWorkflows(
    items: Array<WorkflowIndexItem>
): Promise<Array<[WorkflowIndexItem, string | null]>> {
    const tempPath = getTempDir();
    const results: Array<
        Promise<[WorkflowIndexItem, string | null]>
    > = items.map(async item => {
        const filePath = path.join(tempPath, `${item.name}.yml`);
        try {
            await download(item.url, tempPath);
        } catch (e) {
            return <[WorkflowIndexItem, null]>[item, null];
        }
        const content = await promisify(fs.readFile)(filePath, {
            encoding: UTF8
        });
        return <[WorkflowIndexItem, string]>[item, content];
    });
    return Promise.all(results).then(async data => {
        await promisify(fs.rmdir)(tempPath, { recursive: true });
        return data;
    });
}

export async function readLocalWorkflows(
    items: Array<WorkflowIndexItem>
): Promise<Array<[WorkflowIndexItem, string | null]>> {
    const results: Array<
        Promise<[WorkflowIndexItem, string | null]>
    > = items.map(async item => {
        const filePath = getLocalPath(item.name);
        try {
            const content = await promisify(fs.readFile)(filePath, {
                encoding: UTF8
            });
            return <[WorkflowIndexItem, string]>[item, content];
        } catch {
            return <[WorkflowIndexItem, null]>[item, null];
        }
    });
    return Promise.all(results);
}
