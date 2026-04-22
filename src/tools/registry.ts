export const zecurTools = [
    {
        type: "function",
        function: {
            name: "writeFile",
            description: "Membuat atau mengubah file.",
            parameters: {
                type: "object",
                properties: {
                    path: { type: "string" },
                    content: { type: "string" }
                },
                required: ["path", "content"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "runShell",
            description: "Menjalankan perintah terminal (bash/zsh).",
            parameters: {
                type: "object",
                properties: {
                    command: { type: "string" }
                },
                required: ["command"]
            }
        }
    }
];