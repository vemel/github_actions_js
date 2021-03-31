import chalk from "chalk";
import { diffLines } from "diff";

export function logDiff(oldContent: string, newContent: string): void {
    const diff = diffLines(oldContent, newContent, {
        newlineIsToken: false,
        ignoreWhitespace: false
    });
    diff.forEach(part => {
        if (part.added) {
            part.value
                .split(/\r?\n/)
                .filter(line => line.trim())
                .map(line => console.log(chalk.green(`    +  ${line}`)));
        }
        if (part.removed) {
            part.value
                .split(/\r?\n/)
                .filter(line => line.trim())
                .map(line => console.log(chalk.red(`    -  ${line}`)));
        }
    });
}
