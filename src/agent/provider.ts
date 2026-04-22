import OpenAI from 'openai';

// Catatan: Pastikan kamu menggunakan API Key yang aman di setting user
const openai = new OpenAI({
    apiKey: process.env.OPENROUTER_API_KEY || 'SK_YOUR_KEY_HERE', 
    baseURL: 'https://openrouter.ai/api/v1',
});

export async function callLLM(messages: any[], tools: any[]) {
    try {
        const response = await openai.chat.completions.create({
            model: 'anthropic/claude-3.5-sonnet',
            messages: messages,
            tools: tools,
            tool_choice: 'auto',
        });
        return response.choices[0].message;
    } catch (error) {
        console.error("Zecur Provider Error:", error);
        throw error;
    }
}
