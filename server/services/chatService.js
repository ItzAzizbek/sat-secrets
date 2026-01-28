const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require('@google/generative-ai');
const dotenv = require('dotenv');
dotenv.config();

// Use separate API key for chat as requested
const genAI = new GoogleGenerativeAI(process.env.GEMINI_CHAT_API_KEY || process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel(
  {
    model: "gemini-2.5-flash", 
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
