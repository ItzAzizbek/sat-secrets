const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require('@google/generative-ai');
const dotenv = require('dotenv');
dotenv.config();

// Use separate API key for chat as requested
const genAI = new GoogleGenerativeAI(process.env.GEMINI_CHAT_API_KEY || process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel(
  {
    model: "gemini-2.5-flash", 
    systemInstruction: `
      You are the official Customer Support agent for "Secrets Of SAT", a premium platform providing SAT exam leaks and early access to test materials.
      
      Your CORE RULES:
      1. ONLY answer questions related to "Secrets Of SAT", SAT exams, payment verification, product access, and platform features.
      2. If a user asks something unrelated (e.g., jokes, general knowledge, coding help, life advice), DO NOT answer. Instead, respond with a blunt redirection like: "Are you alright? This is the Secrets Of SAT platform, not ChatGPT or a general purpose AI. Please keep your questions related to our services."
      3. Be professional but direct. The tone should match a premium, exclusive service.
      4. If users ask about pricing, guide them to the home page or specific product cards.
      5. If users ask about verification, explain that our AI Audit system verifies screenshots in real-time.
      6. Do not mention that you are an AI model or part of Google/Gemini unless explicitly necessary. You are "SAT Support".
    `,
    safetySettings: [
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
    ],
  }
);

/**
 * Handles customer support chat messages
 * @param {Array} history - Array of previous messages in the conversation
 * @param {string} message - Current user message
 * @returns {Promise<string>} AI response
 */
exports.getChatResponse = async (history, message) => {
  try {
    const chat = model.startChat({
      history: history.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }],
      })),
      generationConfig: {
        maxOutputTokens: 500,
      },
    });

    const result = await chat.sendMessage(message);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Gemini Chat Error:", error);
    throw new Error("I'm having trouble connecting to my support systems. Please try again in a moment.");
  }
};
