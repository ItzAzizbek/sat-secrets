
exports.summarizeMessage = async (name, message) => {
  return { status: "AI Approved", summary: message, offered_price: null, rejection_reason: null };
};

exports.analyzeScreenshot = async (imageBuffer, mimeType) => {
  console.log("DEBUG: BETA SERVICE CALLED");
  return {
    isReal: true,
    confidence: 1.0,
    reason: "Bypass Service Active"
  };
};
