/*
 * Minimal backend proxy for the health assistant.
 * Requires Node.js 18+ (for built-in fetch). Run: node server/assistant-api.js
 */
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

function loadEnv(filePath) {
    if (!fs.existsSync(filePath)) return;
    for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
        const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
        if (!match || process.env[match[1]]) continue;
        process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, "");
    }
}

loadEnv(path.join(__dirname, ".env"));

const port = Number(process.env.PORT || 3000);
const apiKey = process.env.OPENAI_API_KEY;
const model = process.env.OPENAI_MODEL || "gpt-5.6-luna";
const allowedOrigin = process.env.ALLOWED_ORIGIN || "";

const instructions = `You are a helpful Arabic assistant for Egyptian health-office services. Give clear, concise informational guidance in Egyptian Arabic when appropriate. Do not diagnose, prescribe, or handle emergencies: for urgent symptoms tell the user to seek emergency medical care immediately. If you are unsure about a local procedure, say so and suggest contacting the relevant health office.`;

function setHeaders(response, origin = "") {
    response.setHeader("Content-Type", "application/json; charset=utf-8");
    if (allowedOrigin && origin === allowedOrigin) response.setHeader("Access-Control-Allow-Origin", allowedOrigin);
}

function send(response, status, body, origin) {
    setHeaders(response, origin);
    response.writeHead(status);
    response.end(JSON.stringify(body));
}

function readBody(request) {
    return new Promise((resolve, reject) => {
        let body = "";
        request.on("data", chunk => {
            body += chunk;
            if (body.length > 16000) reject(new Error("Request is too large."));
        });
        request.on("end", () => resolve(body));
        request.on("error", reject);
    });
}

function textFromResponse(payload) {
    if (typeof payload.output_text === "string" && payload.output_text.trim()) return payload.output_text.trim();
    return (payload.output || [])
        .filter(item => item.type === "message")
        .flatMap(item => item.content || [])
        .filter(item => item.type === "output_text")
        .map(item => item.text)
        .join("\n")
        .trim();
}

http.createServer(async (request, response) => {
    const origin = request.headers.origin || "";

    if (request.method === "OPTIONS") {
        setHeaders(response, origin);
        response.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
        response.setHeader("Access-Control-Allow-Headers", "Content-Type");
        response.writeHead(204);
        return response.end();
    }

    if (request.method !== "POST" || request.url !== "/api/assistant") {
        return send(response, 404, { error: "Not found." }, origin);
    }
    if (!apiKey) return send(response, 500, { error: "OPENAI_API_KEY is not configured on the server." }, origin);

    try {
        const { message, history = [] } = JSON.parse(await readBody(request));
        if (typeof message !== "string" || !message.trim()) {
            return send(response, 400, { error: "A message is required." }, origin);
        }

        const safeHistory = Array.isArray(history) ? history.slice(-10) : [];
        const conversation = safeHistory
            .filter(item => item && ["user", "assistant"].includes(item.role) && typeof item.content === "string")
            .map(item => `${item.role === "assistant" ? "Assistant" : "User"}: ${item.content.slice(0, 2000)}`)
            .join("\n");
        const input = `${conversation}${conversation ? "\n" : ""}User: ${message.trim()}`;

        const apiResponse = await fetch("https://api.openai.com/v1/responses", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
            body: JSON.stringify({ model, instructions, input, max_output_tokens: 500 })
        });
        const payload = await apiResponse.json();
        if (!apiResponse.ok) {
            console.error("OpenAI API error:", payload.error?.message || apiResponse.status);
            return send(response, 502, { error: "The AI service is temporarily unavailable." }, origin);
        }

        const reply = textFromResponse(payload);
        if (!reply) return send(response, 502, { error: "The AI service returned no text." }, origin);
        return send(response, 200, { reply }, origin);
    } catch (error) {
        console.error("Assistant API error:", error.message);
        return send(response, 400, { error: "Unable to process this request." }, origin);
    }
}).listen(port, () => console.log(`Health assistant API is listening on http://localhost:${port}`));
