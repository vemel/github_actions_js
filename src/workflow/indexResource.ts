import fs from "fs";
import path from "path";

export default class IndexResource {
    name: string;
    url: string;
    id: string;
    markerFilePath: string | null;
    constructor(
        name: string,
        url: string,
        id: string,
        markerFilePath?: string
    ) {
        this.name = name;
        this.url = url;
        this.id = id;
        this.markerFilePath = markerFilePath || null;
    }

    markerFileExists(localPath: string): boolean {
        if (!this.markerFilePath) return false;
        return fs.existsSync(path.join(localPath, this.markerFilePath));
    }
}
