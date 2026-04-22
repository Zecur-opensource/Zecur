import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { agentLoop } from './agent/loop';

export function activate(context: vscode.ExtensionContext) {
    console.log('Zecur is now active!');

    // 1. Command: Membuka Zecur Panel
    let startDisposable = vscode.commands.registerCommand('zecur.startAgent', () => {
        const panel = vscode.window.createWebviewPanel(
            'zecur', 'Zecur Agent', vscode.ViewColumn.One,
            { enableScripts: true, retainContextWhenHidden: true }
        );

        const htmlPath = path.join(context.extensionPath, 'src', 'webview', 'index.html');
        panel.webview.html = fs.readFileSync(htmlPath, 'utf8');

        // Menangani pesan dari UI
        panel.webview.onDidReceiveMessage(async (message) => {
            if (message.command === 'runTask') {
                try {
                    // Cek kelengkapan konfigurasi
                    const provider = context.globalState.get<string>('zecur_provider') || 'google';
                    const apiKey = await context.secrets.get('zecur_api_key');

                    if (!apiKey) {
                        panel.webview.postMessage({ command: 'aiResponse', text: 'Error: API Key belum diatur. Jalankan "Zecur: Set API Key".' });
                        return;
                    }

                    panel.webview.postMessage({ command: 'aiResponse', text: 'Zecur sedang berpikir...' });

                    // Panggil Agent Loop (The Brain)
                    const result = await agentLoop(message.text, provider, apiKey);
                    panel.webview.postMessage({ command: 'aiResponse', text: result });

                } catch (error: any) {
                    panel.webview.postMessage({ command: 'aiResponse', text: `Error: ${error.message}` });
                }
            }
        });
    });

    // 2. Command: Mengatur API Key (BYOK)
    let setKeyDisposable = vscode.commands.registerCommand('zecur.setApiKey', async () => {
        const apiKey = await vscode.window.showInputBox({ 
            prompt: 'Masukkan API Key Anda', 
            password: true, 
            ignoreFocusOut: true 
        });
        if (apiKey) {
            await context.secrets.store('zecur_api_key', apiKey);
            vscode.window.showInformationMessage('Zecur: API Key berhasil disimpan dengan aman.');
        }
    });

    // 3. Command: Memilih Provider
    let selectProviderDisposable = vscode.commands.registerCommand('zecur.selectProvider', async () => {
        const provider = await vscode.window.showQuickPick(['google', 'openrouter'], {
            placeHolder: 'Pilih AI Provider'
        });
        if (provider) {
            await context.globalState.update('zecur_provider', provider);
            vscode.window.showInformationMessage(`Zecur: Provider diubah ke ${provider}`);
        }
    });

    context.subscriptions.push(startDisposable, setKeyDisposable, selectProviderDisposable);
}

export function deactivate() {}