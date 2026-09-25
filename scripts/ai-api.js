(() => {
    const defaults = {
        enabled: false,
        endpoint: "/api/assistant",
        requestTimeoutMs: 30000
    };

    const config = { ...defaults, ...(window.healthAssistantApiConfig || {}) };

    async function askAssistant(message, history = []) {
        if (!config.enabled) throw new Error("AI assistant is disabled.");

        const controller = new AbortController();
        const timeout = window.setTimeout(() => controller.abort(), config.requestTimeoutMs);

        try {
            const response = await fetch(config.endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message, history }),
                signal: controller.signal
            });

            const payload = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(payload.error || "The assistant request failed.");
            if (!payload.reply || typeof payload.reply !== "string") throw new Error("The assistant returned an invalid response.");
            return payload.reply;
        } finally {
            window.clearTimeout(timeout);
        }
    }

    window.healthAssistantApi = { askAssistant, config };
})();
