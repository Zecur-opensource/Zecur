import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export async function writeFileTool(filePath: string, content: string) {
    const workspaceRoot = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
    if (!workspaceRoot) return;

    const fullPath = path.join(workspaceRoot, filePath);
    fs.writeFileSync(fullPath, content);
    
    // Memberitahu VS Code bahwa file telah berubah
    vscode.window.showInformationMessage(`Zecur: Updated ${filePath}`);
}

export async function readFileTool(filePath: string) {
    const workspaceRoot = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
    const fullPath = path.join(workspaceRoot!, filePath);
    return fs.readFileSync(fullPath, 'utf-8');
}