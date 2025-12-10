import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
console.log(
  "Gemini API Key:",
  apiKey ? `${apiKey.substring(0, 10)}...` : "undefined"
);

const genAI = new GoogleGenerativeAI(apiKey);

export async function makeCallToGemini(text) {
  try {
    if (!apiKey || apiKey === "your_gemini_api_key_here") {
      throw new Error(
        "Clé API Gemini non configurée. Vérifiez votre fichier .env"
      );
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Limiter le texte à 250000 caractères pour éviter de dépasser les limites
    const maxLength = 240000;
    const truncatedText =
      text.length > maxLength ? text.substring(0, maxLength) + "..." : text;

    console.log(
      `Texte original: ${text.length} caractères, texte tronqué: ${truncatedText.length} caractères`
    );

    const prompt = `Résume moi simplement avec des mots simples ce texte : ${truncatedText}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const summaryText = response.text();

    console.log("Résumé Gemini:", summaryText);
    return summaryText;
  } catch (error) {
    console.error("Erreur Gemini:", error);
    throw error;
  }
}
