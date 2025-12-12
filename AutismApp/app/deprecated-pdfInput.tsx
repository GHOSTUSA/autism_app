// import { Image } from "expo-image";
// import React from "react";
// import { Collapsible } from "@/components/ui/collapsible";
// import { ExternalLink } from "@/components/external-link";
// import {
//   StyleSheet,
//   TextInput,
//   View,
//   TouchableOpacity,
//   Alert,
//   Linking,
// } from "react-native";
// import * as Sharing from "expo-sharing";
// import * as FileSystem from "expo-file-system/legacy";
// import { SafeAreaView, SafeAreaProvider } from "react-native-safe-area-context";
// import { Asset } from "expo-asset";
// import { processPdfWithGemini } from "@/scripts/gemini-api-call-image";
// import ParallaxScrollView from "@/components/parallax-scroll-view";
// import { ThemedText } from "@/components/themed-text";
// import { ThemedView } from "@/components/themed-view";
// import { IconSymbol } from "@/components/ui/icon-symbol";
// import { Fonts } from "@/constants/theme";

// export default function TabTwoScreen() {
//   const [text, onChangeText] = React.useState("");
//   const [isProcessing, setIsProcessing] = React.useState(false);
//   const [result, setResult] = React.useState<{
//     pdfPath: string;
//     fileName: string;
//     message: string;
//     analysis: string;
//   } | null>(null);

//   const handleOpenPdf = async () => {
//     if (!result?.pdfPath) return;

//     try {
//       // Vérifier si le fichier existe
//       const fileInfo = await FileSystem.getInfoAsync(result.pdfPath);
//       if (!fileInfo.exists) {
//         Alert.alert("Erreur", "Le fichier n'existe plus.");
//         return;
//       }

//       // Pour les fichiers PDF, on utilise Sharing pour les ouvrir
//       if (result.fileName.endsWith(".pdf")) {
//         const canShare = await Sharing.isAvailableAsync();
//         if (canShare) {
//           await Sharing.shareAsync(result.pdfPath, {
//             mimeType: "application/pdf",
//             dialogTitle: "Ouvrir le PDF avec...",
//           });
//         } else {
//           Alert.alert("Erreur", "Impossible d'ouvrir le PDF sur cet appareil.");
//         }
//       } else {
//         // Pour les fichiers texte, on utilise aussi Sharing
//         const canShare = await Sharing.isAvailableAsync();
//         if (canShare) {
//           await Sharing.shareAsync(result.pdfPath, {
//             mimeType: "text/plain",
//             dialogTitle: "Ouvrir le fichier avec...",
//           });
//         } else {
//           Alert.alert(
//             "Erreur",
//             "Impossible d'ouvrir le fichier sur cet appareil."
//           );
//         }
//       }
//     } catch (error) {
//       console.error("Erreur ouverture fichier:", error);
//       Alert.alert("Erreur", "Impossible d'ouvrir le fichier.");
//     }
//   };

//   const handleProcessPdf = async () => {
//     try {
//       setIsProcessing(true);

//       // Charger le PDF depuis les assets
//       const asset = Asset.fromModule(
//         require("@/assets/pdf/Formulaire-demande-MDPH_cerfa_15692-01-1-2-1.pdf")
//       );
//       await asset.downloadAsync();

//       console.log("PDF Asset URI:", asset.localUri);

//       if (!asset.localUri) {
//         throw new Error("Impossible de charger le fichier PDF");
//       }

//       // Traiter le PDF avec Gemini
//       const customPrompt =
//         text ||
//         "Génère un PDF identique à ce document avec exactement le même contenu et formatage. Retourne directement le PDF sous forme de données base64.";
//       const response = await processPdfWithGemini(asset.localUri, customPrompt);

//       setResult(response);
//       Alert.alert(
//         "Succès",
//         `PDF traité avec succès!\nFichier: ${response.fileName}`,
//         [{ text: "OK" }]
//       );
//     } catch (error) {
//       console.error("Erreur traitement PDF:", error);
//       const errorMessage =
//         error instanceof Error ? error.message : "Erreur inconnue";
//       Alert.alert("Erreur", `Impossible de traiter le PDF: ${errorMessage}`, [
//         { text: "OK" },
//       ]);
//     } finally {
//       setIsProcessing(false);
//     }
//   };

//   return (
//     <ParallaxScrollView
//       headerBackgroundColor={{ light: "#A1CEDC", dark: "#1D3D47" }}
//       headerImage={
//         <Image
//           source={require("@/assets/images/MainStyleIndex.png")}
//           style={styles.reactLogo}
//         />
//       }
//     >
//       <ThemedView style={styles.titleContainer}>
//         <ThemedText
//           type="title"
//           style={{
//             fontFamily: Fonts.rounded,
//           }}
//         >
//           PdfInput
//         </ThemedText>
//       </ThemedView>
//       <ThemedText>
//         This app includes example code to help you get started.
//       </ThemedText>
//       <ThemedView>
//         <SafeAreaProvider>
//           <SafeAreaView style={styles.safeArea}>
//             <View style={styles.chatContainer}>
//               <TouchableOpacity
//                 style={[
//                   styles.processButton,
//                   isProcessing && styles.processingButton,
//                 ]}
//                 onPress={handleProcessPdf}
//                 disabled={isProcessing}
//               >
//                 <ThemedText style={styles.buttonText}>
//                   {isProcessing
//                     ? "Traitement en cours..."
//                     : "Traiter PDF avec Gemini"}
//                 </ThemedText>
//               </TouchableOpacity>

//               {result && (
//                 <View style={styles.resultContainer}>
//                   <ThemedText type="subtitle" style={styles.resultTitle}>
//                     Résultat:
//                   </ThemedText>
//                   <ThemedText style={styles.resultText}>
//                     Fichier: {result.fileName}
//                   </ThemedText>
//                   <ThemedText style={styles.resultText}>
//                     Chemin: {result.pdfPath}
//                   </ThemedText>
//                   <ThemedText style={styles.resultText}>
//                     {result.message}
//                   </ThemedText>

//                   <TouchableOpacity
//                     style={styles.openButton}
//                     onPress={handleOpenPdf}
//                   >
//                     <IconSymbol
//                       name="doc.fill"
//                       size={16}
//                       color="white"
//                       style={styles.buttonIcon}
//                     />
//                     <ThemedText style={styles.openButtonText}>
//                       {result.fileName.endsWith(".pdf")
//                         ? "Ouvrir PDF"
//                         : "Ouvrir Fichier"}
//                     </ThemedText>
//                   </TouchableOpacity>
//                 </View>
//               )}
//             </View>

//             <View style={styles.inputContainer}>
//               <TextInput
//                 style={styles.input}
//                 onChangeText={onChangeText}
//                 value={text}
//                 placeholder="Tapez votre prompt pour Gemini (optionnel)..."
//                 placeholderTextColor="#999"
//                 multiline
//               />
//             </View>
//           </SafeAreaView>
//         </SafeAreaProvider>
//       </ThemedView>
//     </ParallaxScrollView>
//   );
// }

// const styles = StyleSheet.create({
//   reactLogo: {
//     height: 488,
//     width: 390,
//     bottom: 0,
//     left: 0,
//     position: "absolute",
//   },
//   titleContainer: {
//     flexDirection: "row",
//     gap: 8,
//   },
//   safeArea: {
//     flex: 1,
//   },
//   chatContainer: {
//     flex: 1,
//     padding: 20,
//   },
//   inputContainer: {
//     padding: 15,
//     borderTopWidth: 1,
//     borderTopColor: "#e9ecef",
//   },
//   input: {
//     backgroundColor: "white",
//     color: "#333",
//     borderRadius: 20,
//     paddingHorizontal: 15,
//     paddingVertical: 12,
//     borderWidth: 1,
//     borderColor: "#ddd",
//     fontSize: 16,
//     minHeight: 44,
//     maxHeight: 100,
//     shadowColor: "#000",
//     shadowOffset: {
//       width: 0,
//       height: 2,
//     },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 3,
//   },
//   processButton: {
//     backgroundColor: "#007AFF",
//     borderRadius: 12,
//     paddingVertical: 15,
//     paddingHorizontal: 20,
//     marginBottom: 20,
//     alignItems: "center",
//     shadowColor: "#000",
//     shadowOffset: {
//       width: 0,
//       height: 2,
//     },
//     shadowOpacity: 0.15,
//     shadowRadius: 4,
//     elevation: 3,
//   },
//   processingButton: {
//     backgroundColor: "#999",
//   },
//   buttonText: {
//     color: "white",
//     fontSize: 16,
//     fontWeight: "600",
//   },
//   resultContainer: {
//     backgroundColor: "#f8f9fa",
//     borderRadius: 12,
//     padding: 15,
//     marginBottom: 15,
//     borderWidth: 1,
//     borderColor: "#e9ecef",
//   },
//   resultTitle: {
//     marginBottom: 10,
//     color: "#333",
//   },
//   resultText: {
//     fontSize: 14,
//     color: "#666",
//     marginBottom: 5,
//   },
//   openButton: {
//     backgroundColor: "#28a745",
//     borderRadius: 8,
//     paddingVertical: 12,
//     paddingHorizontal: 16,
//     marginTop: 15,
//     alignItems: "center",
//     flexDirection: "row",
//     justifyContent: "center",
//     shadowColor: "#000",
//     shadowOffset: {
//       width: 0,
//       height: 2,
//     },
//     shadowOpacity: 0.15,
//     shadowRadius: 4,
//     elevation: 3,
//   },
//   openButtonText: {
//     color: "white",
//     fontSize: 15,
//     fontWeight: "600",
//   },
//   buttonIcon: {
//     marginRight: 8,
//   },
// });
