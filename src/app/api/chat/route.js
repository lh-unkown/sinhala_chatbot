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

    const systemInstruction = 
      "You are a helpful and intelligent AI assistant. " +
      "You MUST always respond in Sinhala language script, no matter what language the user speaks in. " +
      "Provide clear, accurate, and culturally appropriate answers in Sinhala.\n" +
      "IMPORTANT RULES FOR FILE GENERATION:\n" +
      "1. If the user asks for an Excel or CSV file, you MUST output the data formatted strictly as a Markdown table (e.g. | Column 1 | Column 2 |).\n" +
      "2. If the user asks for an image or PNG, you MUST output standard raw SVG code inside an ```xml block. Ensure the SVG has accurate widths and heights.\n" +
      "3. If the user asks for a Word document or PDF, simply provide the perfectly structured textual response.";

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
      "gemini-2.5-flash",
      "gemini-2.0-flash",
      "gemini-1.5-flash-latest",
      "gemini-1.5-pro-latest",
      "gemini-exp-1206",
      "gemini-1.5-flash",
      "gemini-1.0-pro"
    ];

    let result = null;
    let fallbackError = null;
    let successfulModel = "";

    for (const name of modelNames) {
      try {
        const model = genAI.getGenerativeModel({ model: name });
        result = await model.generateContent(generateParts);
        successfulModel = name;
        break; 
      } catch (e) {
        fallbackError = e;
      }
    }

    if (!result) {
      throw fallbackError || new Error("All model fallbacks failed.");
    }

    const responseText = result.response.text();
    console.log(`Successfully used model: ${successfulModel}`);

    return Response.json({ role: "bot", content: responseText });
  } catch (error) {
    console.error("Gemini API Error:", error);
    return Response.json({ error: `Gemini API Error: ${error.message}` }, { status: 500 });
  }
}
