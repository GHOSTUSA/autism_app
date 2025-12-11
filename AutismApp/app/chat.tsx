import { Link } from "expo-router";
import React from "react";
import { StyleSheet, TextInput, View } from "react-native";
import { SafeAreaView, SafeAreaProvider } from "react-native-safe-area-context";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";

export default function ModalScreen() {
  const [text, onChangeText] = React.useState("");

  return (
    <ThemedView style={styles.container}>
      {/* <ThemedText type="title">This is a the chatbot</ThemedText>
        <Link href="/" dismissTo style={styles.link}>
          <ThemedText type="link">Go to home screen</ThemedText>
        </Link> */}

      <SafeAreaProvider>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.chatContainer}>
            {/* Zone de chat - contenu principal */}
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              onChangeText={onChangeText}
              value={text}
              placeholder="Tapez votre message..."
              placeholderTextColor="#333333"
              multiline
            />
          </View>
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
  },
  chatContainer: {
    flex: 1,
    padding: 20,
  },
  inputContainer: {
    padding: 15,
    backgroundColor: "#b5d2ea",
    borderTopWidth: 1,
    borderTopColor: "#688196",
  },
  input: {
    backgroundColor: "white",
    color: "#333333",
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#b5d2ea",
    fontSize: 16,
    minHeight: 44,
    maxHeight: 100,
    shadowColor: "#333333",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
});
