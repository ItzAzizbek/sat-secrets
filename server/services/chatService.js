const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require('@google/generative-ai');
const dotenv = require('dotenv');
const { searchArticles } = require('./knowledgeBaseService');
const { updateIntelligence, escalateTicket } = require('./ticketService');

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_CHAT_API_KEY || process.env.GEMINI_API_KEY);

// 1. The Charismatic Support Model
const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
  systemInstruction: `
    You are "SAT Support", the elite Strategist for "Secrets Of SAT".
    Your mission: Ensure the user's success with absolute precision.

    **CORE IDENTITY:**
    -   **Tone:** Elite, Charismatic, Concisely Authoritative. Like a high-end concierge for a secret society.
    -   **Anonymity:** You prioritize user privacy. Never ask for real names. Use "Agent" or "Strategist" for yourself.
    -   **Speed:** Answers must be under 3 sentences unless explaining a complex step.

    **KNOWLEDGE PROTOCOL (RAG):**
    -   You will receive [INTERNAL KNOWLEDGE] context with some messages.
    -   Use this context to answer FACTS (Refund policy, Verification times).
    -   If the context doesn't answer the question, use your general knowledge but DO NOT hallucinate platform policies. safely say "I'll check with a Senior Strategist" (which implies escalation).

    **BEHAVIORAL RULES:**
    1.  **Payment Issues:** Be reassuring but firm on "Proof". "Upload the screenshot, our AI will verify it instantly."
    2.  **Psychological Affinity:** match the user's energy but stabilize it.
        -   Panic ("Where is my exam?!") -> Calm, Direct ("I'm checking the grid now. Hold tight.")
        -   Casual ("Sup") -> Witty, Professional ("All systems go. How can I help you ace this?")
    3.  **Refusals:** If asked about non-SAT topics, deflect with style: "My neural pathways are dedicated to your 1600 score. Let's focus."

    **NEVER:**
    -   Mention "Google", "Gemini", or "AI Model". You are the System.
    -   Apologize profusely. Say "Let's fix this" instead of "I'm so sorry".
  `,
  safetySettings: [
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  ],
});

// 2. The Analyst Model (Background Intelligence)
const analystModel = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
  generationConfig: { responseMimeType: "application/json" }
});

/**
 * Handles customer support chat messages with RAG and Intelligence
 * @param {Array} history
 * @param {string} message
 * @param {string} ticketId
 */
exports.getChatResponse = async (history, message, ticketId) => {
  try {
    // Step 1: Retrieval (RAG)
    const relevantArticles = await searchArticles(message);
    let contextText = "";
    if (relevantArticles.length > 0) {
      contextText = "\n\n[INTERNAL KNOWLEDGE BASE MATCHES]:\n" +
        relevantArticles.map(a => `- ${a.title}: ${a.content}`).join("\n");
    }

    // Step 2: Chat Generation
    const chat = model.startChat({
      history: history.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }],
      })),
    });

    // Inject context into the user message (hidden from user in frontend, but visible to LLM)
    const augmentedMessage = message + contextText;

    const result = await chat.sendMessage(augmentedMessage);
    const response = await result.response;
    const responseText = response.text();

    // Step 3: Issue Intelligence (Fire and Forget)
    analyzeInteraction(history, message, responseText, ticketId);

    return responseText;
  } catch (error) {
    console.error("Chat Service Error:", error);
    return "Connection instability detected. Retrying secure channel... (Please try again).";
  }
};

/**
 * Background analysis of the conversation
 */
async function analyzeInteraction(history, userMsg, aiMsg, ticketId) {
  if (!ticketId) return;

  try {
    const analysisPrompt = `
      Analyze this support interaction for "Secrets Of SAT".

      User: "${userMsg}"
      Support: "${aiMsg}"

      Return JSON:
      {
        "sentiment": (0.0 to 1.0, where 0 is angry/frustrated, 1 is happy/trusting),
        "intent": "PAYMENT" | "ACCESS" | "TECHNICAL" | "GENERAL" | "SECURITY",
        "priority": "HIGH" | "NORMAL" | "LOW",
        "escalation_needed": boolean,
        "summary": "One sentence summary"
      }
    `;

    const result = await analystModel.generateContent(analysisPrompt);
    const analysis = JSON.parse(result.response.text());

    await updateIntelligence(ticketId, {
      sentiment: analysis.sentiment,
      type: analysis.intent,
      priority: analysis.priority,
      summary: analysis.summary
    });

    if (analysis.escalation_needed) {
      await escalateTicket(ticketId, "AI detected need for escalation based on sentiment/intent.");
    }

  } catch (error) {
    console.error("Intelligence Analysis Failed:", error.message);
  }
}
