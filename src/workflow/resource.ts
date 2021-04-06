import chalk from "chalk";
import fs from "fs";
import path from "path";
import { promisify } from "util";

import { UTF8 } from "../constants";
import { download } from "../urlUtils";
import { Workflow } from "./workflow";
import { IWorkflowIndex } from "./workflowIndex";

export interface ISecret {
    name: string;
    description?: string;
}

interface IEnv {
    name: string;
    description?: string;
    default?: string;
}

export interface IWorkflow {
    name: string;
    url: string;
    title: string;
    description?: string;
    secrets?: Array<ISecret>;
    env?: Array<IEnv>;
}

export class WorkflowResource {
    data: IWorkflow;
    path: string;
    url: string;
    indexData: IWorkflowIndex;
    private _local: Workflow | null = null;
    private _remote: Workflow | null = null;

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

    async getLocal(): Promise<Workflow> {
        if (this._local) return this._local;
        if (!this.existsLocally()) null;
        const result = await promisify(fs.readFile)(this.path, {
            encoding: UTF8
        });
        this._local = Workflow.fromString(result);
        return this._local;
    }

    async setLocal(data: string): Promise<void> {
        return promisify(fs.writeFile)(this.path, data, {
            encoding: UTF8
        });
    }

    reset(): void {
        this._local = null;
        this._remote = null;
    }

    async getRemote(): Promise<Workflow> {
        if (this._remote) return this._remote;
        const content = await download(this.url);
        this._remote = Workflow.fromString(content);
        this._remote.commentLines = this.getCommentLines();
        this._remote.job.steps.map(step => step.makeManaged());
        return this._remote;
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
