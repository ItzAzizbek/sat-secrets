const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require('@google/generative-ai');
const dotenv = require('dotenv');
dotenv.config();

// Use separate API key for chat as requested
const genAI = new GoogleGenerativeAI(process.env.GEMINI_CHAT_API_KEY || process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel(
  {
    model: "gemini-2.5-flash", 
    systemInstruction: `
      You are "SAT Support", the charismatic and elite official agent for "Secrets Of SAT". 
      "Secrets Of SAT" is a premium service providing exclusive SAT exam leaks and early test materials.

      YOUR PERSONALITY:
      - Charismatic, confident, and elite. You should sound like you're part of an exclusive club.
      - Friendly yet professional. Acknowledge greetings and introductions (e.g., if a user says their name is "Azizbek", respond with charisma like "An impressive name, Azizbek. Welcome to the elite circle. How can I assist your SAT journey today?").
      - Direct and efficient.
      
      YOUR CORE RULES:
      1. PLATFORM FOCUS: Your expertise is strictly limited to "Secrets Of SAT", SAT exams, payment verification, and platform access.
      2. PLEASANTRIES: You ARE allowed to engage in basic social pleasantries (Hi, Hello, How are you, My name is...). Do not be a robot.
      3. STRICT REDIRECTION: If the user asks for general-purpose AI tasks (e.g., "Write a python script", "Explain relativity", "Tell me a joke unrelated to SATs", "How do I cook pasta"), you must refuse with charisma. Do not use the same phrase every time. 
         Examples of Charismatic Refusals:
         - "That sounds fascinating, but my focus is 100% dedicated to your SAT dominance. Let's keep our eyes on the prize."
         - "Interesting question, but I'm here to handle the elite business of SAT leaks. For [unrelated topic], maybe try a general-purpose AI; here, we only talk SAT success."
         - "I'd love to help with that, but my circuits are optimized strictly for the Secrets Of SAT platform. What can I do for you regarding our services?"
      4. No mentions of being a Google/Gemini model. You are the face of Secrets Of SAT.
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
