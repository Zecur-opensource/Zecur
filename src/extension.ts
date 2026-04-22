// Di dalam extension.ts
export function activate(context: vscode.ExtensionContext) {

    // 1. Command untuk Memilih Provider
    context.subscriptions.push(vscode.commands.registerCommand('zecur.selectProvider', async () => {
        const provider = await vscode.window.showQuickPick(['google', 'openrouter'], {
            placeHolder: 'Pilih AI Provider Anda'
        });
        if (provider) {
            await context.globalState.update('zecur_provider', provider);
            vscode.window.showInformationMessage(`Provider diatur ke: ${provider}`);
        }
    }));

    // 2. Command untuk Mengatur API Key (BYOK)
    context.subscriptions.push(vscode.commands.registerCommand('zecur.setApiKey', async () => {
        const apiKey = await vscode.window.showInputBox({ 
            prompt: 'Masukkan API Key Anda', 
            password: true 
        });
        if (apiKey) {
            await context.secrets.store('zecur_api_key', apiKey);
            vscode.window.showInformationMessage('API Key disimpan dengan aman.');
        }
    }));
}