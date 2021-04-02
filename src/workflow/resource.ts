import chalk from "chalk";
import download from "download";
import fs from "fs";
import path from "path";
import { promisify } from "util";

import { UTF8 } from "../constants";
import { getTempDir } from "../utils";
import { IWorkflowIndex } from "./workflowIndex";

export interface ISecret {
    name: string;
    description?: string;
}

export interface IWorkflow {
    name: string;
    url: string;
    title: string;
    description?: string;
    secrets?: Array<ISecret>;
}

export class WorkflowResource {
    data: IWorkflow;
    path: string;
    url: string;
    indexData: IWorkflowIndex;
    private _local?: string | null;
    private _remote?: string | null;

    constructor(
        data: IWorkflow,
        workflowsPath: string,
        url: string,
        indexData: IWorkflowIndex
    ) {
        this.data = data;
        this.path = path.join(workflowsPath, this.fileName);
        this.url = url;
        this.indexData = indexData;
    }

    get name(): string {
        return this.data.name;
    }

    get title(): string | null {
        return this.data.title || null;
    }

    getTitle(action = "in"): string {
        return `${this.title} (${chalk.bold(
            chalk.blue(this.name)
        )}) ${chalk.grey(`${action} ${this.path}`)}`;
    }

    get description(): string | null {
        return this.data.description || null;
    }

    get fileName(): string {
        return `${this.name}.yml`;
    }

    existsLocally(): boolean {
        return fs.existsSync(this.path);
    }

    async getLocal(): Promise<string | null> {
        if (this._local !== undefined) return this._local;
        let result: string | null;
        try {
            result = await promisify(fs.readFile)(this.path, {
                encoding: UTF8
            });
            this._local = result;
        } catch {
            result = null;
        }
        this._local = result;
        return result;
    }

    async setLocal(data: string): Promise<void> {
        return await promisify(fs.writeFile)(this.path, data, {
            encoding: UTF8
        });
    }

    reset(): void {
        this._local = null;
        this._remote = null;
    }

    async getRemote(): Promise<string | null> {
        if (this._remote !== undefined) return this._remote;
        let result: string | null;
        const tempPath = getTempDir();
        const downloadPath = path.join(tempPath, this.fileName);
        try {
            await download(this.url, tempPath, { filename: this.fileName });
            result = await promisify(fs.readFile)(downloadPath, {
                encoding: UTF8
            });
        } catch {
            result = null;
        }
        await promisify(fs.rmdir)(tempPath, { recursive: true });
        this._remote = result;
        return result;
    }

    getCommentLines(): Array<string> {
        const result: Array<string> = [];
        result.push(`This workflow provided by ${this.indexData.name}`);
        if (this.indexData.documentation) {
            result.push(`Documentation: ${this.indexData.documentation}`);
        }
        if (this.data.description) {
            result.push("");
            result.push(...this.data.description.trim().split(/\r?\n/));
        }
        if (this.data.secrets) {
            result.push("");
            result.push("Secrets:");
            result.push(
                ...this.data.secrets.map(secret => {
                    if (secret.description)
                        return `  ${secret.name} - ${secret.description}`;
                    return `  ${secret.name}`;
                })
            );
        }
        return result;
    }
}
