import fs from "fs";
import yaml from "js-yaml";
import path from "path";

import { UTF8 } from "./src/constants";
import { ISecret } from "./src/workflow/resource";
import { IWorkflowData, Workflow } from "./src/workflow/workflow";
import { IWorkflowIndex, WorkflowIndex } from "./src/workflow/workflowIndex";

async function main(): Promise<void> {
    const indexPath = process.argv[2];
    const localPath = path.dirname(indexPath);
    const indexContent = fs.readFileSync(indexPath, { encoding: UTF8 });
    const indexData = yaml.load(indexContent) as IWorkflowIndex;
    const workflowIndex = new WorkflowIndex(
        "https://example.com/",
        indexData,
        localPath
    );
    const secrets: Array<ISecret> = [];
    const workflowTexts: Array<string> = [];
    workflowIndex.getAllWorkflows().forEach(resource => {
        resource.data.secrets?.forEach(secret => {
            const secretNames = secrets.map(i => i.name);
            if (secretNames.includes(secret.name)) return;
            secrets.push(secret);
        });
        const workflowPath = path.join(localPath, resource.data.url);
        const workflowContent = fs.readFileSync(workflowPath, {
            encoding: UTF8
        });
        const workflowYAMLData = yaml.load(workflowContent) as IWorkflowData;

        const workflow = new Workflow(workflowYAMLData, []);
        workflow.job.steps.forEach(step => {
            if (!step.id) throw new Error(`Step ${step.name} has no id`);
            if (step.isManaged())
                throw new Error(`Step ${step.name} is managed`);
        });

        const installString = `\`\`\`bash\n# install this action to .github/workflows\nnpx ghactions -i ${workflowIndex.data.id} -u ${resource.name}\n\`\`\``;
        workflowTexts.push(
            `### ${resource.title}\nWorkflow: [${resource.name}.yml](${resource.data.url})\n\n${installString}\n\n${resource.description}`
        );
    });
    if (secrets.length) {
        console.log("## Secrets");
        secrets.forEach(secret => {
            console.log(`- \`${secret.name}\` - ${secret.description}`);
        });
        console.log("");
    }
    workflowTexts.forEach(text => console.log(text));
}

if (typeof require !== "undefined" && require.main === module) {
    main();
}

export default main;
