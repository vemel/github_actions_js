import fs from "fs";
import http from "http";
import https from "https";
import path from "path";
import { fileURLToPath, URL } from "url";
import { promisify } from "util";

import { UTF8 } from "./constants";
import { getTempDir } from "./utils";

export async function download(url: string): Promise<string> {
    const parsedUrl = new URL(url);
    if (parsedUrl.protocol === "file:") {
        return promisify(fs.readFile)(fileURLToPath(url), { encoding: UTF8 });
    }
    const tempPath = getTempDir();
    const dest = path.join(tempPath, path.basename(url));
    const file = fs.createWriteStream(dest);
    const getFunc = parsedUrl.protocol === "https:" ? https.get : http.get;
    return new Promise((resolve, reject) => {
        const request = getFunc(url, function (response) {
            response.pipe(file);
        });
        file.on("finish", function () {
            file.close();
            resolve(fs.readFileSync(dest, { encoding: UTF8 }));
            fs.rmdirSync(tempPath, { recursive: true });
        });
        request.on("error", function (err) {
            fs.rmdirSync(tempPath, { recursive: true });
            reject(err);
        });
        file.on("error", err => {
            fs.rmdirSync(tempPath, { recursive: true });
            reject(err);
        });
    });
}

export function joinURL(base: string, newPath: string): string {
    const url = new URL(base);
    let oldPathname = url.pathname;
    const origin = base.substr(0, base.length - url.pathname.length);
    if (!base.endsWith("/")) oldPathname = path.dirname(oldPathname);
    const pathname = path.join(oldPathname, newPath);
    return `${origin}${pathname}`;
}
