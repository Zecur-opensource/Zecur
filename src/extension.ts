import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";

export function activate(context: vscode.ExtensionContext) {

    // --- LOGIKA PROVIDER (Dulu ada di provider.ts) ---
    async function getAiResponse(task: string, provider: string, apiKey: string): Promise<string> {
        if (provider === 'google') {
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
            const result = await model.generateContent(task);
            return result.response.text();
        } else {
            const client = new OpenAI({ apiKey: apiKey, baseURL: 'https://openrouter.ai/api/v1' });
            const completion = await client.chat.completions.create({
                model: 'anthropic/claude-3.5-sonnet',
                messages: [{ role: 'user', content: task }]
            });
            return completion.choices[0].message.content || "No response";
        }
    }

    // --- LOGIKA AGENT LOOP (Dulu ada di loop.ts) ---
    async function agentLoop(task: string, provider: string, apiKey: string): Promise<string> {
        // Di sini kamu bisa tambahkan logika recursive jika ingin agent lebih pintar
        // Untuk sekarang, kita panggil provider untuk menjawab
        return await getAiResponse(task, provider, apiKey);
    }

    // --- KOMANDO: START AGENT ---
    let startDisposable = vscode.commands.registerCommand('zecur.startAgent', () => {
        const panel = vscode.window.createWebviewPanel('zecur', 'Zecur Agent', vscode.ViewColumn.One, { enableScripts: true });
        
        const htmlPath = path.join(context.extensionPath, 'src', 'webview', 'index.html');
        panel.webview.html = fs.readFileSync(htmlPath, 'utf8');

        panel.webview.onDidReceiveMessage(async (message) => {
            if (message.command === 'runTask') {
                const provider = context.globalState.get<string>('zecur_provider') || 'google';
                const apiKey = await context.secrets.get('zecur_api_key');

                if (!apiKey) {
                    panel.webview.postMessage({ command: 'aiResponse', text: 'Error: API Key belum diatur.' });
                    return;
                }

                const result = await agentLoop(message.text, provider, apiKey);
                panel.webview.postMessage({ command: 'aiResponse', text: result });
            }
        });
    });

    // --- KOMANDO: SET API KEY ---
    let setKey = vscode.commands.registerCommand('zecur.setApiKey', async () => {
        const key = await vscode.window.showInputBox({ prompt: 'Masukkan API Key', password: true });
        if (key) {
            await context.secrets.store('zecur_api_key', key);
            vscode.window.showInformationMessage('Key tersimpan!');
        }
    });

    // --- KOMANDO: SELECT PROVIDER ---
    let setProv = vscode.commands.registerCommand('zecur.selectProvider', async () => {
        const p = await vscode.window.showQuickPick(['google', 'openrouter']);
        if (p) await context.globalState.update('zecur_provider', p);
    });

    context.subscriptions.push(startDisposable, setKey, setProv);
}
