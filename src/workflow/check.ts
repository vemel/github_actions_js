import chalk from "chalk";

import { yamlDump } from "./../utils";

export type TAction =
    | "up to date"
    | "updated"
    | "deleted"
    | "added"
    | "equal"
    | "kept"
    | "error";

export class Check {
    action: TAction;
    item: string;
    force?: boolean;
    private _oldValue: unknown;
    private _newValue: unknown;

    constructor(
        item: string,
        action: TAction,
        force = false,
        oldValue: unknown = null,
        newValue: unknown = null
    ) {
        this.action = action;
        this.item = item;
        this.force = force;
        this._oldValue = oldValue;
        this._newValue = newValue;
    }

    get oldValue(): string {
        if (typeof this._oldValue === "string") return this._oldValue;
        if (this._oldValue === null) return "";
        return yamlDump(this._oldValue);
    }

    get newValue(): string {
        if (typeof this._newValue === "string") return this._newValue;
        if (this._newValue === null) return "";
        return yamlDump(this._newValue);
    }

    get color(): chalk.Chalk {
        return (
            {
                added: chalk.green,
                updated: chalk.blue,
                error: chalk.red,
                deleted: chalk.yellow
            }[this.action] || chalk.grey
        );
    }

    private getcheckMessage(verb: string): string {
        const prefix = `${this.icon}  ${chalk.bold(this.item)}`;
        if (this.action === "up to date") return `${prefix} is up to date`;
        if (this.action === "error") return `${prefix}`;

        verb = verb ? `${verb} ` : "";
        const message = `${prefix} ${verb}${chalk.bold(this.action)}`;
        if (this.action === "kept")
            return `${message}, because it is no longer managed`;
        return message;
    }

    get checkMessage(): string {
        return this.getcheckMessage("will be");
    }

    get noForceMessage(): string {
        return `${this.icon}  ${chalk.bold(this.item)} can be ${
            this.action
        }, use ${chalk.bold("--force")} flag to apply`;
    }

    get updateMessage(): string {
        return this.getcheckMessage("");
    }

    get icon(): string {
        return (
            {
                updated: "↻",
                deleted: "✖",
                error: "✗",
                added: "✎"
            }[this.action] || "✓"
        );
    }
    isApplied(force: boolean): boolean {
        if (this.isError()) return false;
        if (!force && this.force) return false;
        if (this.action == "equal" || this.action == "kept") return false;
        return true;
    }
    isError(): boolean {
        return this.action === "error";
    }
}
