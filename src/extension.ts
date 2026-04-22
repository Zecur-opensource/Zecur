import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";

export function activate(context: vscode.ExtensionContext) {

    // --- 1. TOOLS (Tangan AI) ---
    async function runShell(cmd: string): Promise<string> {
        return new Promise((resolve) => {
            exec(cmd, { cwd: vscode.workspace.workspaceFolders?.[0].uri.fsPath }, (err, stdout, stderr) => {
                if (err) resolve(`Error: ${err.message}`);
                else resolve(stdout || stderr);
            });
        });
    }

    async function writeFile(filePath: string, content: string): Promise<string> {
        try {
            const fullPath = path.join(vscode.workspace.workspaceFolders?.[0].uri.fsPath || '', filePath);
            fs.writeFileSync(fullPath, content);
            return `File ${filePath} berhasil ditulis.`;
        } catch (e: any) { return `Error menulis file: ${e.message}`; }
    }

    // --- 2. AGENT LOOP (Otak AI) ---
    async function agentLoop(task: string, provider: string, apiKey: string): Promise<string> {
        let history: any[] = [{ role: "user", content: task }];
        let loop = true;
        let finalResponse = "";

        while (loop) {
            // Panggil AI
            let aiMsg: any;
            if (provider === 'google') {
                const genAI = new GoogleGenerativeAI(apiKey);
                const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
                const result = await model.generateContent(JSON.stringify(history));
                aiMsg = { role: "assistant", content: result.response.text() };
            } else {
                const client = new OpenAI({ apiKey: apiKey, baseURL: 'https://openrouter.ai/api/v1' });
                const completion = await client.chat.completions.create({
                    model: 'anthropic/claude-3.5-sonnet',
                    messages: history
                });
                aiMsg = completion.choices[0].message;
            }

            history.push(aiMsg);

            // Cek apakah AI memanggil tool (Logika sederhana: cek string "tool:")
            if (aiMsg.content.includes("exec:")) {
                const cmd = aiMsg.content.split("exec:")[1].trim();
                const output = await runShell(cmd);
                history.push({ role: "tool", content: output });
            } else if (aiMsg.content.includes("write:")) {
                const [f, ...c] = aiMsg.content.split("write:")[1].split("|");
                const output = await writeFile(f.trim(), c.join("|").trim());
                history.push({ role: "tool", content: output });
            } else {
                finalResponse = aiMsg.content;
                loop = false;
            }
        }
        return finalResponse;
    }

    // --- 3. UI & EVENTS ---
    let startDisposable = vscode.commands.registerCommand('zecur.startAgent', () => {
        const panel = vscode.window.createWebviewPanel('zecur', 'Zecur Agent', vscode.ViewColumn.One, { enableScripts: true });
        panel.webview.html = fs.readFileSync(path.join(context.extensionPath, 'src', 'webview', 'index.html'), 'utf8');

        panel.webview.onDidReceiveMessage(async (message) => {
            if (message.command === 'runTask') {
                const provider = context.globalState.get<string>('zecur_provider') || 'google';
                const apiKey = await context.secrets.get('zecur_api_key');

                if (!apiKey) {
                    panel.webview.postMessage({ command: 'aiResponse', text: 'Error: API Key belum diatur.' });
                    return;
                }

                panel.webview.postMessage({ command: 'aiResponse', text: 'Zecur sedang bekerja...' });
                const result = await agentLoop(message.text, provider, apiKey);
                panel.webview.postMessage({ command: 'aiResponse', text: result });
            }
        });
    });

    // --- 4. COMMANDS (Setup) ---
    context.subscriptions.push(startDisposable);
    context.subscriptions.push(vscode.commands.registerCommand('zecur.setApiKey', async () => {
        const key = await vscode.window.showInputBox({ password: true });
        if (key) await context.secrets.store('zecur_api_key', key);
    }));
    context.subscriptions.push(vscode.commands.registerCommand('zecur.selectProvider', async () => {
        const p = await vscode.window.showQuickPick(['google', 'openrouter']);
        if (p) await context.globalState.update('zecur_provider', p);
    }));
}
