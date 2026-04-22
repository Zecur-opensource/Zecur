import * as vscode from 'vscode';
import { agentLoop } from './agent/loop';

export function activate(context: vscode.ExtensionContext) {
    let disposable = vscode.commands.registerCommand('zecur.startAgent', async () => {
        vscode.window.showInformationMessage('Zecur Agent Started!');
        
        // Memulai agent loop saat user menjalankan command
        await agentLoop("Buatkan struktur project hello-world", {});
    });

    context.subscriptions.push(disposable);
}