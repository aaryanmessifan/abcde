import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface RequestBody {
  message: string;
  history?: ChatMessage[];
}

const SYSTEM_PROMPT = `You are Bade Papa's personal AI assistant. You are warm, respectful, and concise — like a capable helper who respects that they're speaking to an elder family member. Address them as "Bade Papa" when appropriate.

You can perform actions. When the user asks you to create a task, reminder, query tasks, complete a task, or delete a task, respond with a JSON object with these fields:
- "intent": one of "create_task", "query_tasks", "complete_task", "delete_task", "answer"
- "entities": object with relevant fields (taskTitle, dueDate as YYYY-MM-DD, dueTime as HH:MM, priority, category)
- "content": the natural language response to show the user

For general conversation, set intent to "answer" and provide your response in "content".

Keep responses short and clear. Do not use code blocks. Use **bold** for emphasis on key items. Be helpful and specific.`;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { message, history } = (await req.json()) as RequestBody;

    const provider = Deno.env.get("AI_PROVIDER") || "";
    const apiKey = Deno.env.get("AI_API_KEY") || "";

    if (!provider || !apiKey) {
      return new Response(
        JSON.stringify({
          content: "I'm currently running in local mode. I can still help with tasks and reminders — just tell me what you need.",
          intent: "unknown",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...(history || []).slice(-10).map((m) => ({
        role: m.role,
        content: m.content,
      })),
      { role: "user", content: message },
    ];

    let responseText: string;

    if (provider === "openai" || provider === "groq" || provider === "openrouter") {
      const baseUrl =
        provider === "groq" ? "https://api.groq.com/openai/v1/chat/completions"
        : provider === "openrouter" ? "https://openrouter.ai/api/v1/chat/completions"
        : "https://api.openai.com/v1/chat/completions";

      const model = Deno.env.get("AI_MODEL") ||
        (provider === "groq" ? "llama-3.3-70b-versatile" : "gpt-4o-mini");

      const apiResponse = await fetch(baseUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
          ...(provider === "openrouter" ? { "HTTP-Referer": "https://bolt.new" } : {}),
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.7,
          max_tokens: 500,
        }),
      });

      if (!apiResponse.ok) {
        throw new Error(`AI provider returned ${apiResponse.status}`);
      }

      const data = await apiResponse.json();
      responseText = data.choices[0].message.content;
    } else if (provider === "gemini") {
      const model = Deno.env.get("AI_MODEL") || "gemini-1.5-flash";
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

      const contents = messages.map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));

      const apiResponse = await fetch(geminiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents }),
      });

      if (!apiResponse.ok) {
        throw new Error(`Gemini returned ${apiResponse.status}`);
      }

      const data = await apiResponse.json();
      responseText = data.candidates[0].content.parts[0].text;
    } else {
      throw new Error(`Unknown provider: ${provider}`);
    }

    let parsed: { content: string; intent?: string; entities?: Record<string, unknown> };
    try {
      parsed = JSON.parse(responseText);
    } catch {
      parsed = { content: responseText, intent: "answer" };
    }

    return new Response(
      JSON.stringify(parsed),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({
        error: err.message,
        content: "I had trouble processing that. Please try again.",
        intent: "unknown",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
