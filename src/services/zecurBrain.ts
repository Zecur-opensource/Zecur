import { GoogleGenerativeAI } from "@google/generative-ai";
import { Vault } from "./vault";

export const askZecur = async (prompt: string, files: any[]) => {
  const key = Vault.getKey();
  const modelName = Vault.getModel();

  if (!key) {
    throw new Error("API Key belum diset! Gunakan perintah 'Zecur: add API_KEY'");
  }

  const genAI = new GoogleGenerativeAI(key);
  const model = genAI.getGenerativeModel({ model: modelName });

  // Membangun konteks dari file yang ada di sidebar
  const context = files
    .map((f) => `FILE: ${f.name}\nCONTENT: ${f.content}`)
    .join("\n\n");

  const fullPrompt = `
    Kamu adalah Zecur AI, asisten coding cerdas untuk Komandan Nasa.
    Gunakan konteks proyek berikut jika relevan:
    ${context}

    Instruksi: ${prompt}
    
    Berikan kode langsung tanpa penjelasan panjang kecuali diminta.
  `;

  const result = await model.generateContent(fullPrompt);
  const response = await result.response;
  return response.text();
};
