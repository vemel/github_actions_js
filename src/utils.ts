import fs from "fs";
import yaml from "js-yaml";
import os from "os";
import path from "path";

import { UTF8 } from "./constants";

export function decapitalize(s: string): string {
    if (!s) return s;
    return `${s[0].toLowerCase()}${s.substr(1)}`;
}

export function getCommandName(): string {
    return (process.argv[1] && process.argv[1].split("/").pop()) || "ghactions";
}

export function getCommandArgs(): string {
    return process.argv.slice(2).join(" ");
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

export function yamlDump(data: unknown): string {
    return yaml.dump(data, {
        lineWidth: 999,
        quotingType: '"'
    });
}
