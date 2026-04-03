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



    const systemInstruction = 
      "You are a helpful and intelligent AI assistant. " +
      "You MUST always respond in Sinhala language script, no matter what language the user speaks in. " +
      "Provide clear, accurate, and culturally appropriate answers in Sinhala.\n" +
      "IMPORTANT RULES FOR MULTIMODAL FILE GENERATION:\n" +
      "1. Do NOT generate files for general questions. If you think the user might want data exported as a file, ASK them first ('Do you want me to create an Excel file for this?').\n" +
      "2. ONLY if the user EXPLICITLY requests a file, you MUST trigger the system creation by appending this EXACT hidden token at the very bottom of your response: `___FILE:TYPE___` (where TYPE is CSV, EXCEL, PNG, WORD, or PDF).\n" +
      "3. When creating CSV/EXCEL, format the data in your response as a standard Markdown table.\n" +
      "4. When creating an image/PNG, output standalone SVG code inside an ```xml block.";

    let promptText = systemInstruction + "\n\n";
    for (const msg of messages) {
      if (msg.role === "user") {
        promptText += `User: ${msg.content}\n`;
      } else {
        promptText += `Assistant: ${msg.content}\n`;
      }
    }
    promptText += "Assistant: ";

    const lastMessage = messages[messages.length - 1];
    const generateParts = [promptText];
    
    if (lastMessage.attachment) {
      generateParts.push({
        inlineData: {
          data: lastMessage.attachment.data,
          mimeType: lastMessage.attachment.mimeType
        }
      });
    }

    const modelNames = [
      "gemini-2.0-flash",
      "gemini-2.5-flash",
      "gemini-flash-latest",
      "gemini-2.5-pro"
    ];

    let result = null;
    let fallbackError = null;
    let successfulModel = "";
    const errors = [];

    for (const name of modelNames) {
      try {
        const model = genAI.getGenerativeModel({ model: name });
        result = await model.generateContent(generateParts);
        successfulModel = name;
        break; 
      } catch (e) {
        errors.push(`${name} failed: ${e.message}`);
        fallbackError = e;
      }
    }

    if (!result) {
      let availableModels = "Could not fetch ListModels.";
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`;
        const resp = await fetch(url);
        const data = await resp.json();
        if (data && data.models) {
          availableModels = data.models.map(m => m.name).join(", ");
        } else {
          availableModels = JSON.stringify(data);
        }
      } catch (err) {
        availableModels = "ListModels fetch failed.";
      }
      console.error("All models failed:", errors);
      console.error("Available models for this key:", availableModels);
      throw new Error(`Models failed. Available to you: ${availableModels}`);
    }

    const responseText = result.response.text();
    console.log(`Successfully used model: ${successfulModel}`);

    return Response.json({ role: "bot", content: responseText });
  } catch (error) {
    console.error("Gemini API Error:", error);
    return Response.json({ error: `Gemini API Error: ${error.message}` }, { status: 500 });
  }
}
