import chalk from "chalk";

import { yamlDump } from "./../utils";
import { Step } from "./step";

type TWorkflowPart =
    | "error"
    | "top comment"
    | "workflow name"
    | "trigger"
    | "job environment"
    | "job runner"
    | "job strategy"
    | "job run condition"
    | "step"
    | "workflow";

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
    item: TWorkflowPart;
    force?: boolean;
    private _oldValue: unknown;
    private _newValue: unknown;

    constructor(
        item: TWorkflowPart,
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

    private getTitle(): string {
        if (this._oldValue instanceof Step && this._oldValue.name)
            return `step ${this._oldValue.name || "unnamed"}`;
        if (this._newValue instanceof Step && this._newValue.name)
            return `step ${this._newValue.name || "unnamed"}`;
        return this.item;
    }

    private getcheckMessage(verb: string): string {
        const prefix = `${this.icon}  ${chalk.bold(this.getTitle())}`;
        if (this.action === "up to date") return `${prefix} is up to date`;
        if (this.action === "error") return `${this.icon}  ${this.oldValue}`;

        verb = verb ? `${verb} ` : "";
        const message = `${prefix} ${verb}${chalk.bold(this.action)}`;
        if (this.action === "kept")
            return `${message}, because it is not managed`;
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
