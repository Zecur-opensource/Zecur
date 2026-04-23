import { exec } from 'child_process';
import * as util from 'util';
import * as vscode from 'vscode';

const execAsync = util.promisify(exec);

export async function runTerminalCommand(command: string) {
    const workspaceRoot = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
    
    try {
        const { stdout, stderr } = await execAsync(command, { cwd: workspaceRoot });
        return `Output:\n${stdout}\n${stderr ? 'Warnings/Errors:\n' + stderr : ''}`;
    } catch (error: any) {
        return `Command Failed: ${error.message}`;
    }
}
