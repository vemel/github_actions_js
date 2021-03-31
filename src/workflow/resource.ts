import download from "download";
import fs from "fs";
import path from "path";
import { promisify } from "util";

import { UTF8 } from "../constants";
import { getTempDir } from "../utils";

export interface IWorkflow {
    name: string;
    url: string;
    title?: string;
    description?: string;
}

export class WorkflowResource {
    data: IWorkflow;
    path: string;
    url: string;

    constructor(data: IWorkflow, workflowsPath: string, url: string) {
        this.data = data;
        this.path = path.join(workflowsPath, this.fileName);
        this.url = url;
    }

    get name(): string {
        return this.data.name;
    }

    get title(): string | null {
        return this.data.title || null;
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
        try {
            return await promisify(fs.readFile)(this.path, {
                encoding: UTF8
            });
        } catch {
            return null;
        }
    }

    async setLocal(data: string): Promise<void> {
        return await promisify(fs.writeFile)(this.path, data, {
            encoding: UTF8
        });
    }

    async getRemote(): Promise<string | null> {
        const tempPath = getTempDir();
        const downloadPath = path.join(tempPath, this.fileName);
        try {
            await download(this.url, tempPath, { filename: this.fileName });
        } catch {
            return null;
        }
        const content = await promisify(fs.readFile)(downloadPath, {
            encoding: UTF8
        });
        await promisify(fs.rmdir)(tempPath, { recursive: true });
        return content;
    }
}
