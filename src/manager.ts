import download from "download";
import fs from "fs";
import yaml from "js-yaml";
import os from "os";
import path from "path";

const LOCAL_WORKFLOWS_PATH = "./.github/workflows";
const UTF8 = "utf-8";

interface Workflow {
    name: string;
}

function getTempDir(): string {
    return fs.mkdtempSync(path.join(os.tmpdir(), "ghactions-"));
}

export function getLocalPath(name: string): string {
    return path.join(LOCAL_WORKFLOWS_PATH, `${name}.yml`);
}

export function updateWorkflow(name: string, content: string): void {
    fs.writeFileSync(getLocalPath(name), content, { encoding: UTF8 });
}

export function getWorkflowTitle(content: string): string {
    const data = <Workflow>yaml.load(content);
    return data.name;
}

export async function readRemoteWorkflows(
    names: Array<string>,
    ref: string
): Promise<Array<[string, string | null]>> {
    const tempPath = getTempDir();
    const results: Array<Promise<[string, string | null]>> = names.map(
        async name => {
            const filePath = path.join(tempPath, `${name}.yml`);
            const url = `https://raw.githubusercontent.com/vemel/github_actions_js/${ref}/workflows/${name}.yml`;
            try {
                await download(url, tempPath);
            } catch (e) {
                return <[string, null]>[name, null];
            }
            return new Promise(resolve => {
                fs.readFile(filePath, { encoding: UTF8 }, (err, content) => {
                    if (err) {
                        resolve([name, null]);
                        return;
                    }
                    resolve([name, content]);
                });
            });
        }
    );
    return Promise.all(results).then(data => {
        return new Promise(resolve => {
            fs.rmdir(tempPath, () => {
                resolve(data);
            });
        });
    });
}

export async function readLocalWorkflows(
    names: Array<string>
): Promise<Array<[string, string | null]>> {
    const results: Array<Promise<[string, string | null]>> = names.map(
        async name => {
            const filePath = getLocalPath(name);
            return new Promise(resolve => {
                fs.readFile(filePath, { encoding: UTF8 }, (err, content) => {
                    if (err) {
                        resolve([name, null]);
                        return;
                    }
                    resolve([name, content]);
                });
            });
        }
    );
    return Promise.all(results);
}
