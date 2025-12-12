import { GoogleGenerativeAI } from "@google/generative-ai";
import * as FileSystem from "expo-file-system/legacy";

const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

console.log(
  "Gemini API Key:",
  apiKey ? `${apiKey.substring(0, 10)}...` : "undefined"
);

const genAI = new GoogleGenerativeAI(apiKey);

export async function processPdfWithGemini(
  pdfUri,
  prompt = "Génère un PDF identique à ce document avec exactement le même contenu. ATTENTION TRES IMPORTANT : Retourne le moi sous la forme d'un code python fait avec reportlab."
) {
  let fileUri = pdfUri;
  let tempPath = null;

  try {
    console.log("Traitement du PDF pour Gemini...");

    if (pdfUri.startsWith("content://")) {
      const tempFileName = `temp_${Date.now()}.pdf`;
      tempPath = `${FileSystem.cacheDirectory}${tempFileName}`;
      await FileSystem.copyAsync({ from: pdfUri, to: tempPath });
      fileUri = tempPath;
    }

    const pdfBase64 = await FileSystem.readAsStringAsync(fileUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    console.log("PDF lu, envoi à Gemini pour génération...");

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const result = await model.generateContent([
      {
        inlineData: {
          data: pdfBase64,
          mimeType: "application/pdf",
        },
      },
      prompt,
    ]);

    const response = await result.response;
    const geminiResponse = response.text();

    console.log(
      "Réponse de Gemini reçue : ",
      response,
      " , tentative de sauvegarde PDF..."
    );

    let outputFileName, outputPath;

    try {
      if (
        geminiResponse.includes("reportlab") ||
        geminiResponse.includes("from reportlab") ||
        geminiResponse.includes("canvas.Canvas") ||
        geminiResponse.includes("def create_") ||
        geminiResponse.includes("base64.b64encode")
      ) {
        console.log(
          "Réponse détectée comme code Python pour PDF, exécution dynamique..."
        );

        try {
          const executedPdfBase64 = await executePythonCode(geminiResponse);

          outputFileName = `gemini_generated_${Date.now()}.pdf`;
          outputPath = `${FileSystem.documentDirectory}${outputFileName}`;

          await FileSystem.writeAsStringAsync(outputPath, executedPdfBase64, {
            encoding: FileSystem.EncodingType.Base64,
          });

          console.log("PDF généré dynamiquement et sauvegardé:", outputPath);

          return {
            pdfPath: outputPath,
            fileName: outputFileName,
            message:
              "PDF généré dynamiquement à partir du code Python de Gemini",
            analysis: geminiResponse,
          };
        } catch (pythonError) {
          console.warn(
            "Impossible d'exécuter le code Python, sauvegarde du code...",
            pythonError
          );

          outputFileName = `gemini_pdf_generator_${Date.now()}.py`;
          outputPath = `${FileSystem.documentDirectory}${outputFileName}`;

          await FileSystem.writeAsStringAsync(outputPath, geminiResponse, {
            encoding: FileSystem.EncodingType.UTF8,
          });

          console.log("Reponse gemini :", geminiResponse);

          console.log("Code Python sauvegardé:", outputPath);

          return {
            pdfPath: outputPath,
            fileName: outputFileName,
            message: "Code Python sauvegardé (exécution dynamique a échoué)",
            analysis: geminiResponse,
          };
        }
      } else if (
        geminiResponse.match(/^[A-Za-z0-9+/]{100,}[=]{0,2}$/m) ||
        geminiResponse.includes("JVBERi0") ||
        geminiResponse.startsWith("%PDF")
      ) {
        console.log("Réponse détectée comme PDF, sauvegarde en PDF...");

        const cleanBase64 = geminiResponse.replace(/[^A-Za-z0-9+/=]/g, "");

        outputFileName = `gemini_output_${Date.now()}.pdf`;
        outputPath = `${FileSystem.documentDirectory}${outputFileName}`;

        await FileSystem.writeAsStringAsync(outputPath, cleanBase64, {
          encoding: FileSystem.EncodingType.Base64,
        });

        console.log("PDF sauvegardé:", outputPath);

        return {
          pdfPath: outputPath,
          fileName: outputFileName,
          message: "Gemini a généré un PDF directement",
          analysis: geminiResponse,
        };
      } else {
        throw new Error("Réponse n'est ni un PDF ni du code Python");
      }
    } catch (pdfError) {
      console.log(
        "La réponse n'est ni un PDF ni du code Python, sauvegarde en texte..."
      );

      outputFileName = `gemini_response_${Date.now()}.txt`;
      outputPath = `${FileSystem.documentDirectory}${outputFileName}`;

      await FileSystem.writeAsStringAsync(outputPath, geminiResponse, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      console.log("Réponse sauvegardée en texte:", outputPath);

      return {
        pdfPath: outputPath,
        fileName: outputFileName,
        message: "Gemini a généré du texte (sauvegardé en .txt)",
        analysis: geminiResponse,
      };
    }
  } catch (error) {
    console.error("Erreur traitement PDF avec Gemini:", error);
    throw error;
  } finally {
    if (tempPath) {
      try {
        await FileSystem.deleteAsync(tempPath);
        console.log("Fichier temporaire nettoyé.");
      } catch (deleteError) {
        console.warn(
          "Impossible de supprimer le fichier temporaire:",
          deleteError
        );
      }
    }
  }
}

async function executePythonCode(pythonCode) {
  try {
    console.log("Exécution du code Python via API en ligne...");

    let cleanedCode = pythonCode
      .replace(/```python\s*/g, "")
      .replace(/```\s*/g, "")
      .trim();

    console.log("Code nettoyé, longueur:", cleanedCode);

    const modifiedCode =
      cleanedCode +
      `

# Code ajouté automatiquement pour retourner le PDF
if __name__ == "__main__":
    try:
        pdf_base64 = create_mdph_form()
        print("PDF_BASE64_START")
        print(pdf_base64)
        print("PDF_BASE64_END")
    except Exception as e:
        print(f"ERREUR: {e}")
`;

    if (cleanedCode.includes("reportlab")) {
      console.log(
        "Code utilise reportlab, tentative avec service Python dédié..."
      );

      try {
        return await executeWithPyodide(cleanedCode);
      } catch (pyodideError) {
        console.warn(
          "Pyodide a échoué, tentative avec service cloud...",
          pyodideError
        );

        try {
          return await executeWithCloudService(cleanedCode);
        } catch (cloudError) {
          console.warn(
            "Service cloud a échoué, tentative service backup...",
            cloudError
          );

          try {
            return await executeWithBackupService(cleanedCode);
          } catch (backupError) {
            console.error("Tous les services ont échoué:", backupError);
            throw new Error(
              "Impossible d'exécuter le code Python avec reportlab - Tous les services ont échoué"
            );
          }
        }
      }
    }

    const response = await fetch("https://emkc.org/api/v2/piston/execute", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        language: "python",
        version: "3.10.0",
        files: [
          {
            name: "main.py",
            content: modifiedCode,
          },
        ],
        stdin: "",
        args: [],
        compile_timeout: 10000,
        run_timeout: 15000,
      }),
    });

    if (!response.ok) {
      throw new Error(`Erreur API Piston: ${response.status}`);
    }

    const result = await response.json();

    if (result.run && result.run.code === 0) {
      const output = result.run.stdout || "";

      const startMarker = "PDF_BASE64_START";
      const endMarker = "PDF_BASE64_END";
      const startIndex = output.indexOf(startMarker);
      const endIndex = output.indexOf(endMarker);

      if (startIndex !== -1 && endIndex !== -1) {
        const pdfBase64 = output
          .substring(startIndex + startMarker.length, endIndex)
          .trim()
          .replace(/\n/g, "");

        console.log("PDF généré avec succès via Python");
        return pdfBase64;
      } else {
        throw new Error("Impossible d'extraire le PDF du code Python");
      }
    } else {
      const errorMessage = result.run ? result.run.stderr : "Erreur inconnue";
      throw new Error(`Erreur d'exécution Python: ${errorMessage}`);
    }
  } catch (error) {
    console.error("Erreur exécution Python:", error);
    throw error;
  }
}

async function executeWithPyodide(pythonCode) {
  console.log("Tentative d'exécution avec Pyodide...");

  const pyodideWrapper = `
import js
from js import fetch
import asyncio

# Installation des packages nécessaires
await js.pyodide.loadPackage(['micropip'])
import micropip
await micropip.install('reportlab')

# Code utilisateur
${pythonCode}

# Exécution
if 'create_mdph_form' in globals():
    try:
        pdf_base64 = create_mdph_form()
        js.console.log("PDF_BASE64_START")
        js.console.log(pdf_base64)
        js.console.log("PDF_BASE64_END")
    except Exception as e:
        js.console.log(f"ERREUR: {e}")
else:
    js.console.log("ERREUR: fonction create_mdph_form non trouvée")
`;

  try {
    const response = await fetch("https://pyodide-notebook.org/api/execute", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        code: pyodideWrapper,
        packages: ["reportlab", "micropip"],
      }),
    });

    if (response.ok) {
      const result = await response.json();
      if (result.output) {
        const output = result.output;
        const startMarker = "PDF_BASE64_START";
        const endMarker = "PDF_BASE64_END";
        const startIndex = output.indexOf(startMarker);
        const endIndex = output.indexOf(endMarker);

        if (startIndex !== -1 && endIndex !== -1) {
          const pdfBase64 = output
            .substring(startIndex + startMarker.length, endIndex)
            .trim()
            .replace(/\n/g, "");

          console.log("PDF généré avec succès via Pyodide");
          return pdfBase64;
        }
      }
    }
  } catch (error) {
    console.warn("Pyodide direct a échoué, tentative avec wrapper:", error);
  }

  throw new Error("Pyodide execution failed");
}

async function executeWithCloudService(pythonCode) {
  console.log("Tentative avec service cloud...");

  const wrappedCode =
    pythonCode +
    `

# Code d'exécution automatique
if __name__ == "__main__":
    try:
        if 'create_mdph_form' in globals():
            pdf_base64 = create_mdph_form()
            print("PDF_BASE64_START")
            print(pdf_base64)
            print("PDF_BASE64_END")
        else:
            print("ERREUR: fonction create_mdph_form non trouvée")
    except Exception as e:
        print(f"ERREUR: {e}")
        import traceback
        traceback.print_exc()
`;

  try {
    const response = await fetch("https://codepen.io/api/v1/pens", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: "MDPH PDF Generator",
        html: "",
        css: "",
        js: "",
        python: wrappedCode,
        run_python: true,
        private: true,
      }),
    });

    if (response.ok) {
      const result = await response.json();
      if (result.output) {
        const output = result.output;
        const startMarker = "PDF_BASE64_START";
        const endMarker = "PDF_BASE64_END";
        const startIndex = output.indexOf(startMarker);
        const endIndex = output.indexOf(endMarker);

        if (startIndex !== -1 && endIndex !== -1) {
          const pdfBase64 = output
            .substring(startIndex + startMarker.length, endIndex)
            .trim()
            .replace(/\n/g, "");

          console.log("PDF généré avec succès via CodePen");
          return pdfBase64;
        }
      }
    }
  } catch (codepenError) {
    console.warn("CodePen a échoué:", codepenError);
  }

  try {
    const response = await fetch("https://replit.com/api/run", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        language: "python3",
        code: wrappedCode,
        install_packages: ["reportlab"],
      }),
    });

    if (response.ok) {
      const result = await response.json();
      if (result.output) {
        const output = result.output;
        const startMarker = "PDF_BASE64_START";
        const endMarker = "PDF_BASE64_END";
        const startIndex = output.indexOf(startMarker);
        const endIndex = output.indexOf(endMarker);

        if (startIndex !== -1 && endIndex !== -1) {
          const pdfBase64 = output
            .substring(startIndex + startMarker.length, endIndex)
            .trim()
            .replace(/\n/g, "");

          console.log("PDF généré avec succès via Replit");
          return pdfBase64;
        }
      }
    }
  } catch (replitError) {
    console.warn("Replit a échoué:", replitError);
  }

  throw new Error("Tous les services cloud ont échoué");
}

async function executeWithBackupService(pythonCode) {
  console.log("Utilisation du service de backup...");

  try {
    const response = await fetch("https://runkit.com/api/runs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        source: `
// Installation de reportlab
const { execSync } = require('child_process');
execSync('pip install reportlab', { stdio: 'inherit' });

// Exécution du code Python
const { spawn } = require('child_process');
const python = spawn('python3', ['-c', \`${pythonCode.replace(/`/g, "\\`")}\`]);

python.stdout.on('data', (data) => {
  console.log(data.toString());
});

python.stderr.on('data', (data) => {
  console.error(data.toString());
});
`,
        mode: "endpoint",
      }),
    });

    if (response.ok) {
      const result = await response.json();
      if (result.output) {
        const output = result.output;
        const startMarker = "PDF_BASE64_START";
        const endMarker = "PDF_BASE64_END";
        const startIndex = output.indexOf(startMarker);
        const endIndex = output.indexOf(endMarker);

        if (startIndex !== -1 && endIndex !== -1) {
          const pdfBase64 = output
            .substring(startIndex + startMarker.length, endIndex)
            .trim()
            .replace(/\n/g, "");

          console.log("PDF généré avec succès via RunKit");
          return pdfBase64;
        }
      }
    }
  } catch (runkitError) {
    console.warn("RunKit a échoué:", runkitError);
  }

  try {
    const response = await fetch(
      "https://colab.research.google.com/api/execute",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: `!pip install reportlab\n${pythonCode}`,
          runtime: "python3",
        }),
      }
    );

    if (response.ok) {
      const result = await response.json();
      if (result.output) {
        const output = result.output;
        const startMarker = "PDF_BASE64_START";
        const endMarker = "PDF_BASE64_END";
        const startIndex = output.indexOf(startMarker);
        const endIndex = output.indexOf(endMarker);

        if (startIndex !== -1 && endIndex !== -1) {
          const pdfBase64 = output
            .substring(startIndex + startMarker.length, endIndex)
            .trim()
            .replace(/\n/g, "");

          console.log("PDF généré avec succès via Colab");
          return pdfBase64;
        }
      }
    }
  } catch (colabError) {
    console.warn("Colab a échoué:", colabError);
  }

  throw new Error("Service de backup a échoué");
}

async function generateSimplePdfFromText(pythonCode) {
  console.log("Génération d'un PDF simple à partir du contenu...");

  const textContent = extractContentFromPython(pythonCode);

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Formulaire MDPH</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            margin: 40px; 
            line-height: 1.6; 
        }
        .header { 
            text-align: center; 
            margin-bottom: 30px; 
        }
        .title { 
            font-size: 24px; 
            font-weight: bold; 
            margin: 20px 0; 
            text-decoration: underline;
        }
        .section { 
            margin: 20px 0; 
            padding: 15px;
            border: 1px solid #ccc;
        }
        .yellow-box { 
            background-color: #FDE983; 
            padding: 15px; 
            margin: 15px 0;
        }
        .orange-box { 
            background-color: #F7B847; 
            padding: 15px; 
            margin: 15px 0;
        }
        .checkbox { 
            display: inline-block; 
            width: 12px; 
            height: 12px; 
            border: 1px solid black; 
            margin-right: 8px;
        }
    </style>
</head>
<body>
    <div class="header">
        <div>cerfa N°15692*01</div>
        <div style="float: right;">
            <div style="color: #0032A0; font-weight: bold;">Liberté Égalité Fraternité</div>
            <div style="font-weight: bold;">RÉPUBLIQUE FRANÇAISE</div>
            <div>MINISTÈRE DES AFFAIRES SOCIALES ET DE LA SANTÉ</div>
        </div>
        <div style="clear: both;"></div>
    </div>
    
    <div class="title">DEMANDE À LA MDPH</div>
    
    <div class="section">
        <p>Article R 146-26 du code de l'action sociale et des familles</p>
        <p>La MDPH, c'est la Maison départementale des personnes handicapées.</p>
        <p>Elle étudie votre situation pour répondre aux besoins liés à votre handicap.</p>
    </div>
    
    <div class="section">
        <h3>À qui s'adresse ce formulaire ?</h3>
        <p>Ce formulaire s'adresse à la personne présentant un handicap.</p>
        <p>Si la personne concernée a moins de 18 ans, ses parents sont invités à répondre pour elle.</p>
    </div>
    
    <div class="yellow-box">
        <strong>Vous allez expliquer à la MDPH votre situation, vos besoins, vos projets et vos attentes.</strong>
        <br><strong>En fonction des conditions prévues par la réglementation, vous pourrez peut-être bénéficier des droits suivants :</strong>
        <ul>
            <li>Allocation d'éducation de l'enfant handicapé (AEEH)</li>
            <li>Allocation aux adultes handicapés (AAH)</li>
            <li>Carte mobilité inclusion</li>
            <li>Orientation vers un établissement médico-social</li>
            <li>Prestation de compensation du handicap (PCH)</li>
        </ul>
    </div>
    
    <div class="section">
        <h3>Que dois-je remplir ?</h3>
        <p><span class="checkbox"></span> C'est ma première demande à la MDPH</p>
        <p><span class="checkbox"></span> Ma situation a changé</p>
        <p><span class="checkbox"></span> Je souhaite une réévaluation</p>
        <p><span class="checkbox"></span> Je souhaite le renouvellement de mes droits</p>
    </div>
    
    <div class="section">
        <h3>Vous avez déjà un dossier à la MDPH ?</h3>
        <p><span class="checkbox"></span> Oui &nbsp;&nbsp; Dans quel département : _____________ &nbsp;&nbsp; N° de dossier : _____________</p>
    </div>
    
    ${textContent}
</body>
</html>`;

  try {
    const response = await fetch(
      "https://api.html-css-to-pdf.com/v1/generate",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          html: htmlContent,
          css: "",
          options: {
            format: "A4",
            margin: {
              top: "20mm",
              bottom: "20mm",
              left: "15mm",
              right: "15mm",
            },
          },
        }),
      }
    );

    if (response.ok) {
      const result = await response.json();
      if (result.pdf) {
        console.log("PDF simple généré avec succès");
        return result.pdf;
      }
    }
  } catch (htmlToPdfError) {
    console.warn("API HTML-to-PDF a échoué:", htmlToPdfError);
  }

  console.log("Création d'un fichier texte formaté...");
  const textOnlyContent = `
DEMANDE À LA MDPH
cerfa N°15692*01

Article R 146-26 du code de l'action sociale et des familles
La MDPH, c'est la Maison départementale des personnes handicapées.
Elle étudie votre situation pour répondre aux besoins liés à votre handicap.

À qui s'adresse ce formulaire ?
Ce formulaire s'adresse à la personne présentant un handicap.

Que dois-je remplir ?
☐ C'est ma première demande à la MDPH
☐ Ma situation a changé  
☐ Je souhaite une réévaluation
☐ Je souhaite le renouvellement de mes droits

Vous avez déjà un dossier à la MDPH ?
☐ Oui   Dans quel département : _______  N° de dossier : _______

${textContent}
`;

  return btoa(unescape(encodeURIComponent(textOnlyContent)));
}

function extractContentFromPython(pythonCode) {
  const strings = pythonCode.match(/"([^"]+)"/g) || [];
  const cleanStrings = strings
    .map((s) => s.replace(/"/g, ""))
    .filter((s) => s.length > 10)
    .join("\n\n");

  return cleanStrings || "Contenu extrait du code Python généré par Gemini.";
}
