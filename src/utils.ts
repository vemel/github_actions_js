import fs from "fs";
import os from "os";
import path from "path";

import { UTF8 } from "./constants";

export function decapitalize(s: string): string {
    if (!s) return s;
    return `${s[0].toLowerCase()}${s.substr(1)}`;
}

export function joinURL(base: string, newPath: string): string {
    const url = new URL(base);
    let oldPathname = url.pathname;
    if (!base.endsWith("/")) oldPathname = path.dirname(oldPathname);
    const pathname = path.join(oldPathname, newPath);
    return new URL(pathname, url.origin).href;
}

export function getCommandName(): string {
    return (process.argv[1] && process.argv[1].split("/").pop()) || "ghactions";
}

export function getVersionString(): string {
    const rootPath = path.dirname(path.dirname(__filename));
    const packageJSONPath = path.join(rootPath, "package.json");
    if (!fs.existsSync(packageJSONPath)) return "unknown";
    const packageJSON = JSON.parse(
        fs.readFileSync(packageJSONPath, { encoding: UTF8 })
    );
    return `${packageJSON.name} ${packageJSON.version}`;
}

export function getTempDir(): string {
    return fs.mkdtempSync(path.join(os.tmpdir(), "ghactions-"));
}
