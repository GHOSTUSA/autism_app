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
  FlatList,
  Dimensions,
} from "react-native";
import { SafeAreaView, SafeAreaProvider } from "react-native-safe-area-context";
import * as DocumentPicker from "expo-document-picker";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { extractTextFromPdf } from "../scripts/exctract-text-from-pdf";

interface PdfFile {
  id: string;
  name: string;
  uri: string;
  extractedText: string;
  dateAdded: Date;
}

export default function MultiTextPdfScreen() {
  const [pdfFiles, setPdfFiles] = useState<PdfFile[]>([]);
  const [selectedPdfs, setSelectedPdfs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [extractingId, setExtractingId] = useState<string | null>(null);

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
        const newPdfId = Date.now().toString();

        // Ajouter le PDF à la liste
        const newPdf: PdfFile = {
          id: newPdfId,
          name: file.name,
          uri: file.uri,
          extractedText: "",
          dateAdded: new Date(),
        };

        setPdfFiles((prev) => [...prev, newPdf]);

        // Extraire le texte en arrière-plan
        setExtractingId(newPdfId);
        try {
          const extractedText = await extractTextFromPdf(file.uri);
          if (extractedText !== null) {
            setPdfFiles((prev) =>
              prev.map((pdf) =>
                pdf.id === newPdfId ? { ...pdf, extractedText } : pdf
              )
            );
          }
        } catch (extractError) {
          console.error("Erreur extraction:", extractError);
          Alert.alert(
            "Erreur",
            `Impossible d'extraire le texte de ${file.name}`
          );
        } finally {
          setExtractingId(null);
        }
      }
    } catch (error) {
      console.error("Erreur lors de la sélection:", error);
      Alert.alert("Erreur", "Impossible de sélectionner le PDF");
    } finally {
      setLoading(false);
    }
  };

  const togglePdfSelection = (pdf: PdfFile) => {
    setSelectedPdfs((prev) => {
      if (prev.includes(pdf.id)) {
        return prev.filter((id) => id !== pdf.id);
      } else {
        return [...prev, pdf.id];
      }
    });
  };

  const selectAllPdfs = () => {
    setSelectedPdfs(pdfFiles.map((pdf) => pdf.id));
  };

  const deselectAllPdfs = () => {
    setSelectedPdfs([]);
  };

  const removePdf = (pdfId: string) => {
    setPdfFiles((prev) => prev.filter((pdf) => pdf.id !== pdfId));
    setSelectedPdfs((prev) => prev.filter((id) => id !== pdfId));
  };

  const clearAll = () => {
    setPdfFiles([]);
    setSelectedPdfs([]);
  };

  const getConcatenatedText = () => {
    const selectedPdfObjects = pdfFiles.filter((pdf) =>
      selectedPdfs.includes(pdf.id)
    );
    const header =
      "Tu dois résumer simplement l'évolution entre ces différents documents. Pour ce faire aide toi des dates pour te fier correctement de l'évolution.";
    return (
      header +
      selectedPdfObjects
        .map((pdf) => {
          const pdfHeader = `\n\n=== ${pdf.name} ===\n\n`;
          return pdfHeader + pdf.extractedText;
        })
        .join("")
        .trim()
    );
  };

  const renderPdfIcon = ({ item }: { item: PdfFile }) => {
    const isExtracting = extractingId === item.id;
    const isSelected = selectedPdfs.includes(item.id);

    return (
      <TouchableOpacity
        style={[styles.pdfIcon, isSelected && styles.selectedPdfIcon]}
        onPress={() => togglePdfSelection(item)}
        onLongPress={() => {
          Alert.alert(
            "Supprimer PDF",
            `Voulez-vous supprimer "${item.name}" ?`,
            [
              { text: "Annuler", style: "cancel" },
              {
                text: "Supprimer",
                style: "destructive",
                onPress: () => removePdf(item.id),
              },
            ]
          );
        }}
      >
        <View style={styles.pdfIconContent}>
          {isExtracting ? (
            <ActivityIndicator size="small" color="#007AFF" />
          ) : (
            <Text style={styles.pdfIconText}>PDF</Text>
          )}
          {isSelected && (
            <View style={styles.selectionIndicator}>
              <Text style={styles.checkmark}>✓</Text>
            </View>
          )}
        </View>
        <Text style={styles.pdfIconName} numberOfLines={2}>
          {item.name}
        </Text>
      </TouchableOpacity>
    );
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
                <Text style={styles.buttonText}>Ajouter PDF</Text>
              )}
            </TouchableOpacity>

            {pdfFiles.length > 0 && (
              <TouchableOpacity style={styles.clearButton} onPress={clearAll}>
                <Text style={styles.clearButtonText}>Tout effacer</Text>
              </TouchableOpacity>
            )}
          </View>

          {pdfFiles.length > 0 && (
            <View style={styles.pdfGridContainer}>
              <View style={styles.sectionHeader}>
                <ThemedText style={styles.sectionTitle}>
                  PDFs chargés ({pdfFiles.length})
                </ThemedText>
                <View style={styles.selectionControls}>
                  <TouchableOpacity
                    style={styles.selectionButton}
                    onPress={selectAllPdfs}
                  >
                    <Text style={styles.selectionButtonText}>Tout</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.selectionButton}
                    onPress={deselectAllPdfs}
                  >
                    <Text style={styles.selectionButtonText}>Aucun</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <FlatList
                data={pdfFiles}
                renderItem={renderPdfIcon}
                keyExtractor={(item) => item.id}
                numColumns={3}
                contentContainerStyle={styles.pdfGrid}
                showsVerticalScrollIndicator={false}
              />
            </View>
          )}

          {selectedPdfs.length > 0 && (
            <View style={styles.selectedPdfInfo}>
              <ThemedText style={styles.selectedPdfTitle}>
                PDFs sélectionnés ({selectedPdfs.length}):
              </ThemedText>
              <ThemedText style={styles.selectedPdfNames}>
                {pdfFiles
                  .filter((pdf) => selectedPdfs.includes(pdf.id))
                  .map((pdf) => pdf.name)
                  .join(", ")}
              </ThemedText>
            </View>
          )}

          <ScrollView style={styles.textContainer}>
            {selectedPdfs.length > 0 ? (
              <Text
                style={styles.extractedText}
                selectable={true}
                selectTextOnFocus={true}
              >
                {getConcatenatedText()}
              </Text>
            ) : (
              <Text style={styles.placeholder}>
                Sélectionnez un ou plusieurs PDFs pour voir leur contenu...
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
  pdfGridContainer: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  selectionControls: {
    flexDirection: "row",
    gap: 8,
  },
  selectionButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  selectionButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "500",
  },
  pdfGrid: {
    paddingVertical: 10,
  },
  pdfIcon: {
    flex: 1,
    aspectRatio: 1,
    margin: 8,
    maxWidth: (Dimensions.get("window").width - 80) / 3,
    backgroundColor: "white",
    borderRadius: 10,
    padding: 10,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  selectedPdfIcon: {
    backgroundColor: "#E3F2FD",
    borderColor: "#007AFF",
    borderWidth: 2,
  },
  pdfIconContent: {
    width: 40,
    height: 40,
    backgroundColor: "#F44336",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    position: "relative",
  },
  pdfIconText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  selectionIndicator: {
    position: "absolute",
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    backgroundColor: "#34C759",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "white",
  },
  checkmark: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  pdfIconName: {
    fontSize: 10,
    textAlign: "center",
    color: "#333",
    lineHeight: 12,
  },
  selectedPdfInfo: {
    backgroundColor: "#f0f8ff",
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: "#007AFF",
  },
  selectedPdfTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#007AFF",
  },
  selectedPdfName: {
    fontSize: 16,
    fontWeight: "500",
    marginTop: 4,
  },
  selectedPdfNames: {
    fontSize: 14,
    fontWeight: "400",
    marginTop: 4,
    lineHeight: 18,
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: "#666",
  },
});
