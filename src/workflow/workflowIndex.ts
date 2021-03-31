import download from "download";
import fs from "fs";
import yaml from "js-yaml";
import path from "path";
import { promisify } from "util";

import { UTF8 } from "../constants";
import { getTempDir, joinURL } from "../utils";
import { IWorkflow, WorkflowResource } from "./resource";

export interface IWorkflowIndex {
    name: string;
    workflows: Array<IWorkflow>;
}

export class WorkflowIndex {
    url: string;
    data: IWorkflowIndex;
    name: string;
    workflowsPath: string;

    constructor(url: string, data: IWorkflowIndex, workflowsPath: string) {
        this.data = data;
        this.url = url;
        this.name = this.data.name;
        this.workflowsPath = workflowsPath;
    }

    get names(): Array<string> {
        return this.data.workflows.map(w => w.name);
    }

    getURL(url: string): string {
        if (url.startsWith("./")) {
            return joinURL(this.url, url);
        }
        return url;
    }

    getWorkflow(name: string): WorkflowResource {
        const data = this.data.workflows.find(w => w.name === name);
        if (!data) throw new Error(`Workflow ${name} does not exist in index`);
        return new WorkflowResource(
            data,
            this.workflowsPath,
            this.getURL(data.url)
        );
    }

    getAllWorkflows(): Array<WorkflowResource> {
        return this.names.map(name => this.getWorkflow(name));
    }

    getExistingWorkflows(): Array<WorkflowResource> {
        return this.getAllWorkflows().filter(workflow =>
            workflow.existsLocally()
        );
    }

    getWorkflows(names: Array<string>): Array<WorkflowResource> {
        const result: Array<WorkflowResource> = [];
        names.forEach(name => {
            const workflows: Array<WorkflowResource> = {
                all: this.getAllWorkflows(),
                existing: this.getExistingWorkflows()
            }[name] || [this.getWorkflow(name)];
            result.push(
                ...workflows.filter(
                    w => !result.map(x => x.name).includes(w.name)
                )
            );
        });
        return result;
    }

    static async download(
        url: string,
        workflowsPath: string
    ): Promise<WorkflowIndex> {
        const tempPath = getTempDir();
        const downloadPath = path.join(tempPath, "index.yml");
        try {
            await download(url, tempPath, { filename: "index.yml" });
        } catch (e) {
            throw new Error(`index download failed: ${e.message}`);
        }
        const content = await promisify(fs.readFile)(downloadPath, {
            encoding: UTF8
        });
        await promisify(fs.rmdir)(tempPath, { recursive: true });
        const data = yaml.load(content) as IWorkflowIndex;
        return new WorkflowIndex(url, data, workflowsPath);
    }
}
