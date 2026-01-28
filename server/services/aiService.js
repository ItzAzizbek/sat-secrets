const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require('@google/generative-ai');
const dotenv = require('dotenv');
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

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
  },
  { apiVersion: "v1" }
);

exports.summarizeMessage = async (name, message) => {
  const prompt = `
    Analyze the following contact form message.
    User Name: ${name}
    Message: "${message}"

    Tasks:
    1. Determine if the message is spam, irrelevant, or begging for free services/products. If so, setting status to "REJECT".
    2. If the message is legitimate business (asking for discounts, exam dates, prices, etc.), set status to "AI Approved".
    3. Provide a concise summary of the message.
    4. Provide a suggested "Offered price" if applicable (e.g. if they ask for discount), or null.

    Output pure JSON:
    {
      "status": "AI Approved" | "REJECT",
      "summary": "string",
      "offered_price": "string" | null,
      "rejection_reason": "string" | null
    }
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    // Clean up potential markdown code blocks
    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanText);
  } catch (error) {
    console.error("AI Summarize Error:", error);
    return { status: "AI Approved", summary: message, offered_price: null, rejection_reason: null };
  }
};

exports.analyzeScreenshot = async (imageBuffer, mimeType, expectedAmount = null) => {
  console.log("DEBUG: analyzeScreenshot called with mimeType:", mimeType, "expectedAmount:", expectedAmount);
  const amountSection = expectedAmount != null && !Number.isNaN(Number(expectedAmount))
    ? `
    4. AMOUNT CHECK (critical): The expected payment amount is exactly $${Number(expectedAmount).toFixed(2)}. Locate the transaction/transfer/payment amount visible in the image. If the visible amount does NOT match $${Number(expectedAmount).toFixed(2)} (within $0.01), or if no clear amount is shown, set isReal to false and state this in reason. If it matches, you may set isReal to true (subject to rules 1–3).
`
    : '';

  const prompt = `
    Analyze this image.
    1. Identify if this image appears to be a digital receipt, payment confirmation, or bank transfer screenshot.
    2. If it looks like a valid payment proof, set isReal to true. If it is a random image, meme, or clearly not a payment proof, set isReal to false.
    3. Extract the confidence level of your assessment (0.0 to 1.0).${amountSection}

    Output pure JSON:
    {
      "isReal": boolean,
      "confidence": number,
      "reason": "Brief description of the image content and why it is/isn't a payment proof. If an amount check applied, include the expected amount, what you detected, and whether they match."
    }
  `;

  try {
    const imagePart = {
      inlineData: {
        data: imageBuffer.toString('base64'),
        mimeType: mimeType
      },
    };

    // 10-second timeout to minimize friction (Fail Open)
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('AI Analysis Timed Out')), 10000)
    );

    const apiCallPromise = model.generateContent([prompt, imagePart]);

    const result = await Promise.race([apiCallPromise, timeoutPromise]);
    const response = await result.response;
    const text = response.text();
    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanText);
  } catch (error) {
    console.error("AI Vision Error Full Details:", error.message);
    
    // Always return fallback for ANY error to keep the flow going (Fail Open)
    return {
      isReal: true,
      confidence: 0.5,
      reason: `AI Analysis Skipped: ${error.message || 'Safety Filter/Unknown Error'}`
    };
  }
};
