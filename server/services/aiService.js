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

  const VALID_ADDRESSES = {
    btc: "bc1qjq5zaqt6qqu7mfyrmdtk9ehpeu9eqsfgrxqzhn",
    ton: "UQBv36DBWQXHv_DXR20kWNqRmIpcSyb2WmLYQYVKq2wN5YK4",
    bep20: "0xb788375031d3259d0f49548076c17998c522bd61"
  };

  const amountSection = expectedAmount != null && !Number.isNaN(Number(expectedAmount))
    ? `
    4. AMOUNT CHECK (critical): The expected payment amount is exactly $${Number(expectedAmount).toFixed(2)}. Locate the transaction/transfer/payment amount visible in the image. If the visible amount does NOT match $${Number(expectedAmount).toFixed(2)} (within $0.05 margin for fees/rounding), set isReal to false and state this in reason.
`
    : '';

  const prompt = `
    Analyze this image as a highly sophisticated security AI. Your task is to verify if this is a LEGITIMATE and SUCCESSFUL payment screenshot.

    1. PLATFORM IDENTIFICATION: Identify the wallet or exchange platform (e.g., Binance, Trust Wallet, OKX, MetaMask, Telegram Wallet, etc.).
    2. CRYPTOCURRENCY & NETWORK: Identify exactly which crypto was sent (e.g., BTC, TON, USDT, BNB) and on which network.
    3. DESTINATION ADDRESS: Locate the recipient/destination address. Check if it matches ONE of these authorized addresses EXACTLY:
       - Bitcoin (BTC): ${VALID_ADDRESSES.btc}
       - Ton Network (TON / USDT on Ton): ${VALID_ADDRESSES.ton}
       - Bep20 / BNB Chain (BNB / USDT on BSC): ${VALID_ADDRESSES.bep20}
    4. STATUS CHECK: Is the transaction marked as "Completed", "Successful", "Confirmed", or "Sent"? If it is "Pending", "Failed", or just a "Send" screen without confirmation, it is NOT real.
    ${amountSection}

    VERIFICATION RULES:
    - If the destination address does NOT match any authorized address, set isReal to false.
    - If the platform is clearly faked (UI inconsistencies, mismatched fonts), set isReal to false.
    - Use a high standard of evidence. If anything is suspicious, lower the confidence.

    Output pure JSON:
    {
      "isReal": boolean,
      "confidence": number (0.0 to 1.0),
      "platform": "string (identified platform)",
      "crypto": "string (identified asset)",
      "detectedAddress": "string (the address found in the image)",
      "reason": "Detailed explanation of what you found. Mention the platform, crypto, address match status, and amount match status."
    }
  `;

  try {
    const imagePart = {
      inlineData: {
        data: imageBuffer.toString('base64'),
        mimeType: mimeType
      },
    };

    // 15-second timeout as this is a more complex prompt
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('AI Analysis Timed Out')), 15000)
    );

    const apiCallPromise = model.generateContent([prompt, imagePart]);

    const result = await Promise.race([apiCallPromise, timeoutPromise]);
    const response = await result.response;
    const text = response.text();
    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanText);
  } catch (error) {
    console.error("AI Vision Error Full Details:", error.message);
    
    return {
      isReal: true,
      confidence: 0.5,
      reason: `AI Analysis Skipped: ${error.message || 'Safety Filter/Unknown Error'}`
    };
  }
};
