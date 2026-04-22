import { callLLM } from './provider';
import { zecurTools } from '../tools/registry';
import { writeFileTool } from '../tools/fileTools';
import { runShellTool } from '../tools/shell';

export async function agentLoop(task: string, history: any[] = []) {
    // Tambahkan task user ke history
    history.push({ role: "user", content: task });

    let loop = true;
    while (loop) {
        const response = await callLLM(history, zecurTools);
        history.push(response as any); // Simpan "pemikiran" AI

        if (response.tool_calls) {
            for (const toolCall of response.tool_calls) {
                const args = JSON.parse(toolCall.function.arguments);
                let toolOutput = "";

                // Eksekusi Tool
                if (toolCall.function.name === 'writeFile') {
                    await writeFileTool(args.path, args.content);
                    toolOutput = `File ${args.path} berhasil disimpan.`;
                } else if (toolCall.function.name === 'runShell') {
                    toolOutput = await runShellTool(args.command);
                }

                // Masukkan hasil eksekusi kembali ke AI agar dia bisa "melihat" hasilnya
                history.push({
                    role: 'tool',
                    tool_call_id: toolCall.id,
                    content: toolOutput
                } as any);
            }
        } else {
            // AI sudah selesai
            console.log("Zecur:", response.content);
            loop = false;
        }
    }
}