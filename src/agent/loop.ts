import { callLLM } from './provider';
import { readFileTool, writeFileTool } from '../tools/fileTools';

export async function agentLoop(task: string, context: any) {
    let history = [{ role: "system", content: "Kamu adalah Zecur, AI Agent untuk coding." }];
    let finished = false;

    while (!finished) {
        const response = await callLLM(history, task);
        
        if (response.action === "finish") {
            finished = true;
            break;
        }

        // Logic "Hands": Menjalankan tool sesuai instruksi AI
        if (response.action === "write_file") {
            await writeFileTool(response.path, response.content);
        }
        
        history.push({ role: "assistant", content: JSON.stringify(response) });
    }
}