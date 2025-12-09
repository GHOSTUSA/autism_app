import * as FileSystem from "expo-file-system/legacy";

export async function extractTextFromPdf(uri) {
  try {
    // Copier le fichier vers le cache si c'est un URI content://
    let fileUri = uri;
    if (uri.startsWith("content://")) {
      const fileName = `temp_pdf_${Date.now()}.pdf`;
      const cacheUri = `${FileSystem.cacheDirectory}${fileName}`;
      await FileSystem.copyAsync({
        from: uri,
        to: cacheUri,
      });
      fileUri = cacheUri;
    }

    // Lire le fichier PDF en base64
    const base64Data = await FileSystem.readAsStringAsync(fileUri, {
      encoding: "base64",
    });

    // Nettoyer le fichier temporaire si on en a créé un
    if (uri.startsWith("content://")) {
      try {
        await FileSystem.deleteAsync(fileUri);
      } catch (deleteError) {
        console.warn(
          "Impossible de supprimer le fichier temporaire:",
          deleteError
        );
      }
    }

    // Extraction basique de texte depuis le PDF
    // Décoder le base64 et chercher des patterns de texte
    const pdfBuffer = atob(base64Data);

    // Méthode simple d'extraction de texte depuis un PDF
    // Les PDFs stockent le texte entre des balises spécifiques
    let extractedText = "";

    // Chercher les objets de texte dans le PDF
    const textPattern = /\(([^)]+)\)/g;
    const streamPattern = /stream\s*([\s\S]*?)\s*endstream/gi;

    let match;

    // Extraire le texte des objets textuels
    while ((match = textPattern.exec(pdfBuffer)) !== null) {
      const text = match[1]
        .replace(/\\n/g, "\n")
        .replace(/\\r/g, "\r")
        .replace(/\\t/g, "\t")
        .replace(/\\\(/g, "(")
        .replace(/\\\)/g, ")")
        .replace(/\\\\/g, "\\");

      if (text.length > 2 && !/^[\x00-\x1F\x7F-\xFF]*$/.test(text)) {
        extractedText += text + " ";
      }
    }

    // Si pas de texte trouvé, essayer une méthode alternative
    if (extractedText.trim().length === 0) {
      // Chercher dans les streams
      while ((match = streamPattern.exec(pdfBuffer)) !== null) {
        const stream = match[1];
        // Extraire les caractères imprimables
        const printableText = stream.replace(/[^\x20-\x7E\n\r\t]/g, " ").trim();
        if (printableText.length > 10) {
          extractedText += printableText + "\n";
        }
      }
    }

    if (extractedText.trim().length === 0) {
      return "Aucun texte extractible trouvé dans ce PDF.\n\nCe PDF pourrait :\n- Contenir uniquement des images\n- Être protégé\n- Utiliser un encodage non standard\n\nPour une extraction complète, utilisez un service PDF professionnel.";
    }

    return extractedText.trim();
  } catch (error) {
    console.error("Erreur lors de l'extraction du texte PDF:", error);
    throw error;
  }
}
