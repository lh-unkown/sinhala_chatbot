import { GoogleGenerativeAI } from "@google/generative-ai";

let genAI = null;
if (process.env.GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
}

export async function POST(req) {
  try {
    if (!genAI) {
      return Response.json(
        { error: "GEMINI_API_KEY Environment Variable is missing." },
        { status: 500 }
      );
    }

    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return Response.json({ error: "Invalid payload." }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    // The system instruction forces it to be a Sinhala Chatbot.
    const systemInstruction = 
      "You are a helpful and intelligent AI assistant. " +
      "You MUST always respond in Sinhala language script, no matter what language the user speaks in. " +
      "Provide clear, accurate, and culturally appropriate answers in Sinhala.";

    // Convert our internal message format to Gemini's expected format
    const history = messages.slice(0, -1).map((msg) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }],
    }));

    // Start a chat session with the instruction embedded as early context
    const chat = model.startChat({
        history: [
            { role: "user", parts: [{ text: systemInstruction }] },
            { role: "model", parts: [{ text: "හරි, මම ඔබට උදව් කරන්නම්. මම සෑම විටම සිංහලෙන් ප්‍රතිචාර දක්වන්නෙමි." }] },
            ...history
        ],
    });

    const userMessage = messages[messages.length - 1].content;
    const result = await chat.sendMessage(userMessage);

    const responseText = result.response.text();

    return Response.json({ role: "bot", content: responseText });
  } catch (error) {
    console.error("Gemini API Error:", error);
    return Response.json({ error: `Backend Error: ${error.message}` }, { status: 500 });
  }
}
