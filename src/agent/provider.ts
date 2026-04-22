import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";

export async function getAiClient(provider: string, apiKey: string) {
    if (provider === 'google') {
        const genAI = new GoogleGenerativeAI(apiKey);
        return genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    } 
    
    if (provider === 'openrouter') {
        return new OpenAI({
            apiKey: apiKey,
            baseURL: 'https://openrouter.ai/api/v1',
        });
    }
    
    throw new Error("Provider tidak dikenal");
}

export async function executePrompt(client: any, provider: string, prompt: string) {
    if (provider === 'google') {
        const result = await client.generateContent(prompt);
        return result.response.text();
    }
    
    if (provider === 'openrouter') {
        const completion = await client.chat.completions.create({
            model: 'anthropic/claude-3.5-sonnet',
            messages: [{ role: 'user', content: prompt }]
        });
        return completion.choices[0].message.content;
    }
}