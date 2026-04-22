import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { agentLoop } from './agent/loop';

export function activate(context: vscode.ExtensionContext) {
    let disposable = vscode.commands.registerCommand('zecur.startAgent', () => {
        // 1. Membuat Panel Webview
        const panel = vscode.window.createWebviewPanel(
            'zecur', 
            'Zecur Agent', 
            vscode.ViewColumn.One, 
            { 
                enableScripts: true,
                retainContextWhenHidden: true // Agar chat tidak hilang saat panel ditutup
            }
        );

        // 2. Memuat HTML
        const htmlPath = path.join(context.extensionPath, 'src', 'webview', 'index.html');
        panel.webview.html = fs.readFileSync(htmlPath, 'utf8');

        // 3. Menangani Pesan dari Webview (UI ke Backend)
        panel.webview.onDidReceiveMessage(async (message) => {
            if (message.command === 'runTask') {
                try {
                    // Update UI: Memberi tahu user bahwa Zecur sedang bekerja
                    panel.webview.postMessage({ command: 'aiResponse', text: 'Zecur sedang berpikir...' });

                    // Memanggil Agent Loop
                    // Kita asumsikan agentLoop akan memproses dan menulis file
                    await agentLoop(message.text);

                    // Update UI: Memberi tahu user bahwa tugas selesai
                    panel.webview.postMessage({ command: 'aiResponse', text: 'Tugas selesai, Komandan!' });
                } catch (error: any) {
                    panel.webview.postMessage({ command: 'aiResponse', text: `Error: ${error.message}` });
                }
            }
        });
    });

    context.subscriptions.push(disposable);
}
