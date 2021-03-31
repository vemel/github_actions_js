import chalk from "chalk";

import { yamlDump } from "./../utils";

export type TAction = "updated" | "deleted" | "added" | "equal" | "kept";

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
                deleted: chalk.yellow
            }[this.action] || chalk.grey
        );
    }

    get messagePostfix(): string {
        if (this.action === "kept") return ", because it is not managed";
        return "";
    }

    get checkMessage(): string {
        return `${this.icon}  ${chalk.bold(this.item)} will be ${chalk.bold(
            this.action
        )}${this.messagePostfix}`;
    }

    get noForceMessage(): string {
        return `${this.icon}  ${chalk.bold(this.item)} can be ${
            this.action
        }, use ${chalk.bold("--force")} flag to apply`;
    }

    get updateMessage(): string {
        return `${this.icon}  ${chalk.bold(this.item)} ${this.action}${
            this.messagePostfix
        }`;
    }

    get icon(): string {
        return {
            equal: "✓",
            kept: "✓",
            updated: "↻",
            deleted: "✖",
            added: "✎"
        }[this.action];
    }
    isApplied(force: boolean): boolean {
        if (!force && this.force) return false;
        if (this.action == "equal" || this.action == "kept") return false;
        return true;
    }
}
