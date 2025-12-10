import { Link } from "expo-router";
import React, { useState } from "react";
import {
  StyleSheet,
  TextInput,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView, SafeAreaProvider } from "react-native-safe-area-context";
import * as DocumentPicker from "expo-document-picker";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { extractTextFromPdf } from "../scripts/exctract-text-from-pdf";
import { makeCallToGemini } from "@/scripts/gemini-api-call";

export default function TextPdfScreen() {
  const [extractedText, setExtractedText] = useState("");
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState("");

  const pickAndExtractPdf = async () => {
    try {
      setLoading(true);

      // Sélectionner le fichier PDF
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
        copyToCacheDirectory: false,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const file = result.assets[0];
        setFileName(file.name);

        const decodedText = await extractTextFromPdf(file.uri);
        const resulte = await makeCallToGemini(decodedText);

        if (resulte !== null) {
          setExtractedText(resulte);
        }
      }
    } catch (error) {
      console.error("Erreur lors de l'extraction:", error);
      Alert.alert("Erreur", "Impossible d'extraire le texte du PDF");
    } finally {
      setLoading(false);
    }
  };

  const clearText = () => {
    setExtractedText("");
    setFileName("");
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaProvider>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <ThemedText type="title">Extraction de texte PDF</ThemedText>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.pickButton}
              onPress={pickAndExtractPdf}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.buttonText}>Choisir un PDF</Text>
              )}
            </TouchableOpacity>

            <Link href="/multiTextPdf" asChild>
              <TouchableOpacity style={styles.modalButton}>
                <Text style={styles.buttonText}>Voir pdf</Text>
              </TouchableOpacity>
            </Link>

            {extractedText && (
              <TouchableOpacity style={styles.clearButton} onPress={clearText}>
                <Text style={styles.clearButtonText}>Effacer</Text>
              </TouchableOpacity>
            )}
          </View>

          {fileName && (
            <View style={styles.fileInfo}>
              <ThemedText>Fichier: {fileName}</ThemedText>
            </View>
          )}

          <ScrollView style={styles.textContainer}>
            {extractedText ? (
              <Text
                style={styles.extractedText}
                selectable={true}
                selectTextOnFocus={true}
              >
                {extractedText}
              </Text>
            ) : (
              <Text style={styles.placeholder}>
                Le texte extrait apparaîtra ici...
              </Text>
            )}
          </ScrollView>
        </SafeAreaView>
      </SafeAreaProvider>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    padding: 20,
  },
  header: {
    marginBottom: 20,
    alignItems: "center",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 20,
  },
  pickButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 10,
    minWidth: 150,
    alignItems: "center",
  },
  modalButton: {
    backgroundColor: "#34C759",
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 10,
    minWidth: 150,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  clearButton: {
    backgroundColor: "#FF3B30",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  clearButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  fileInfo: {
    backgroundColor: "#f0f0f0",
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
  },
  textContainer: {
    flex: 1,
    backgroundColor: "#f9f9f9",
    borderRadius: 10,
    padding: 15,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  extractedText: {
    fontSize: 14,
    lineHeight: 20,
    color: "#333",
  },
  placeholder: {
    fontSize: 14,
    color: "#999",
    fontStyle: "italic",
    textAlign: "center",
    marginTop: 50,
  },
});
