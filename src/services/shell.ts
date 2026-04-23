import { exec } from 'child_process';
import * as util from 'util';

const execAsync = util.promisify(exec);

export async function runShellTool(command: string) {
    try {
        const { stdout, stderr } = await execAsync(command);
        return `Output:\n${stdout}\nError (if any):\n${stderr}`;
    } catch (error: any) {
        return `Command Failed: ${error.message}`;
    }
}