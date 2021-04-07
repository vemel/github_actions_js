import chalk from "chalk";

import { yamlDump } from "./../utils";
import { Job } from "./job";
import { Step } from "./step";

type TWorkflowPart =
    | "error"
    | "top comment"
    | "workflow name"
    | "trigger"
    | "job"
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

    private static _dumpValue(value: unknown): string {
        if (typeof value === "string") return value;
        if (value === null) return "";
        if (value instanceof Job) return yamlDump({ [value.name]: value.data });
        if (value instanceof Step) return yamlDump(value.data);
        return yamlDump(value);
    }

    get oldValue(): string {
        return Check._dumpValue(this._oldValue);
    }

    get newValue(): string {
        return Check._dumpValue(this._newValue);
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
        if (this.item === "step") {
            if (this._oldValue instanceof Step) {
                return this._oldValue.title;
            }
            if (this._newValue instanceof Step) {
                return this._newValue.title;
            }
            return new Step({}).title;
        }
        if (this.item === "job") {
            if (this._oldValue instanceof Job) {
                return this._oldValue.title;
            }
            if (this._newValue instanceof Job) {
                return this._newValue.title;
            }
            return this.item;
        }
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
        return `${this.icon}  ${chalk.bold(this.getTitle())} can be ${
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
