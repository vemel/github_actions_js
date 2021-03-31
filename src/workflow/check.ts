import chalk from "chalk";

export type TAction = "updated" | "deleted" | "added" | "equal" | "kept";

export class Check {
    action: TAction;
    item: string;
    force?: boolean;
    constructor(item: string, action: TAction, force = false) {
        this.action = action;
        this.item = item;
        this.force = force;
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
        return `  ${this.icon}  ${chalk.bold(this.item)} can be ${
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
