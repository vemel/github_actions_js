import equal from "deep-equal";

interface IEnv {
    [index: string]: string;
}

interface IStepWith {
    "github-actions-managed"?: boolean;
    "github-actions-comment"?: string;
    script?: string;
    [index: string]: unknown;
}

export interface IStepData {
    name?: string;
    id?: string;
    with?: IStepWith;
    env?: IEnv;
    run?: string;
    [index: string]: unknown;
}

export class Step {
    data: IStepData;
    constructor(data: IStepData) {
        this.data = data;
    }

    get id(): string | null {
        return this.data.id || null;
    }

    get name(): string | null {
        return this.data.name || this.id || null;
    }

    isManaged(): boolean {
        if (this.data.with?.["github-actions-managed"]) return true;
        if (this.data.run) {
            const lines = this.data.run.split(/\r?\n/).map(x => x.trim());
            if (lines.includes("# github-actions-managed: true")) return true;
        }
        if (this.data.with?.script) {
            const lines = this.data.with.script
                .split(/\r?\n/)
                .map(x => x.trim());
            if (lines.includes("// github-actions-managed: true")) return true;
        }
        return false;
    }

    makeNonManaged(): Step {
        if (!this.isManaged()) return this;
        if (
            this.data.run &&
            this.data.run.includes("# github-actions-managed: true")
        ) {
            const lines: Array<string> = this.data.run
                .split(/\r?\n/)
                .filter((l, i) => i || l.trim())
                .filter(l => l.trim() !== "# github-actions-managed: true");
            this.data.run = lines.join("\n");
        }
        if (
            this.data.with?.script &&
            this.data.with.script.includes("// github-actions-managed: true")
        ) {
            const lines: Array<string> = this.data.with.script
                .split(/\r?\n/)
                .filter((l, i) => i || l.trim())
                .filter(l => l.trim() !== "// github-actions-managed: true");
            this.data.with.script = lines.join("\n");
        }
        if (this.data.with?.["github-actions-managed"]) {
            delete this.data.with["github-actions-managed"];
            if (Object.keys(this.data.with).length === 0) {
                delete this.data.with;
            }
        }
        return this;
    }

    makeManaged(): Step {
        if (this.isManaged()) return this;
        if (this.data.run) {
            if (this.data.run.includes("\n")) {
                const lines: Array<string> = [
                    "# github-actions-managed: true",
                    ...this.data.run
                        .split(/\r?\n/)
                        .filter((l, i) => i || l.trim())
                ];
                this.data.run = lines.join("\n");
            } else {
                this.data.run = `# github-actions-managed: true\n${this.data.run}`;
            }
            return this;
        }
        if (this.data.with?.script) {
            if (this.data.with.script.includes("\n")) {
                const lines: Array<string> = [
                    "// github-actions-managed: true",
                    ...this.data.with.script
                        .split(/\r?\n/)
                        .filter((l, i) => i || l.trim())
                ];
                this.data.with.script = lines.join("\n");
            } else {
                this.data.with.script = `// github-actions-managed: true\n${this.data.with.script}`;
            }
            return this;
        }
        if (this.data.with?.["github-actions-managed"]) {
            this.data.with["github-actions-managed"] = true;
            return this;
        }
        this.data.with = {
            "github-actions-managed": true,
            ...(this.data.with || {})
        };
        return this;
    }

    hasSameId(step: Step): boolean {
        if (this.id === step.id) return true;
        return false;
    }

    equals(step: Step): boolean {
        return equal(this.data, step.data);
    }

    findIndex(steps: Array<Step>): number {
        for (let i = 0; i < steps.length; i++) {
            if (this.hasSameId(steps[i])) return i;
        }
        return -1;
    }

    clone(): Step {
        const newData = JSON.parse(JSON.stringify(this.data));
        return new Step(newData);
    }
}
