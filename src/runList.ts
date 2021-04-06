import chalk from "chalk";

import { WorkflowResource } from "./workflow/resource";
import { Workflow } from "./workflow/workflow";

export function runList(resource: WorkflowResource, workflow: Workflow): void {
    const state = resource.existsLocally()
        ? "is installed to"
        : "can be installed to";
    console.log(
        `${chalk.blue(workflow.name)} ${chalk.grey(state)} ${chalk.bold(
            resource.path
        )}`
    );
    if (workflow.commentLines.length) {
        workflow.commentLines.forEach(line => console.log(`  ${line}`));
        console.log("");
    }
}

export async function runListAll(
    resources: Array<WorkflowResource>
): Promise<void> {
    const workflows = await Promise.all(
        resources.map(resource => resource.getRemote())
    );
    resources.forEach((resource, index) => {
        const workflow = workflows[index];
        runList(resource, workflow);
    });
}
