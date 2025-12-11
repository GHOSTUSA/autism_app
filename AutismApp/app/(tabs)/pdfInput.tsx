import { Image } from "expo-image";
import React, { useState } from "react";
import {
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
  Alert,
  ActivityIndicator,
} from "react-native";

import ParallaxScrollView from "@/components/parallax-scroll-view";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Fonts } from "@/constants/theme";
import { makeCallToGemini } from "../../scripts/gemini-api-call";

const moods = [
  { id: 1, name: "😊 Joyeux", emoji: "😊", color: "#ebee99" },
  { id: 2, name: "😔 Triste", emoji: "😔", color: "#b5d2ea" },
  { id: 3, name: "😤 Frustré", emoji: "😤", color: "#ebb7b5" },
  { id: 4, name: "😰 Anxieux", emoji: "😰", color: "#b5d2ea" },
  { id: 5, name: "😴 Fatigué", emoji: "😴", color: "#f5f4f2" },
  { id: 6, name: "😌 Calme", emoji: "😌", color: "#ebee99" },
];

const energyLevels = [
  { id: 1, name: "🔋 Plein d'énergie", icon: "🔋", color: "#32CD32" },
  { id: 2, name: "⚡ Énergique", icon: "⚡", color: "#FFD700" },
  { id: 3, name: "🟡 Modéré", icon: "🟡", color: "#FFA500" },
  { id: 4, name: "🔶 Faible", icon: "🔶", color: "#FF6347" },
  { id: 5, name: "🪫 Épuisé", icon: "🪫", color: "#B22222" },
];

const getAdvice = (mood: any, energy: any) => {
  if (!mood || !energy) return null;

  // Conseils basés sur la combinaison humeur/énergie
  const adviceMap: { [key: string]: string } = {
    "1-1":
      "C'est parfait ! Profitez de cette énergie positive pour faire des activités que vous aimez.",
    "1-2":
      "Belle humeur et bonne énergie ! C'est le moment idéal pour socialiser ou essayer quelque chose de nouveau.",
    "1-3":
      "Vous êtes de bonne humeur, prenez le temps de savourer ce moment avec des activités relaxantes.",
    "1-4":
      "Malgré la fatigue, votre bonne humeur est précieuse. Optez pour des activités douces qui vous font plaisir.",
    "1-5":
      "Même épuisé(e), vous gardez le sourire ! Reposez-vous en faisant quelque chose qui vous réconforte.",

    "2-1":
      "Vous avez de l'énergie malgré la tristesse. Canalisez-la dans une activité physique douce ou créative.",
    "2-2":
      "Un peu de mouvement peut aider à améliorer votre humeur. Essayez une promenade ou de la musique.",
    "2-3":
      "Prenez soin de vous en douceur. Un bain chaud ou un livre peuvent vous réconforter.",
    "2-4":
      "La tristesse et la fatigue sont difficiles. Contactez un proche ou pratiquez la respiration profonde.",
    "2-5":
      "Moment difficile. Reposez-vous, hydratez-vous et n'hésitez pas à demander de l'aide.",

    "3-1":
      "Cette énergie peut vous aider à évacuer la frustration. Essayez le sport ou exprimer vos émotions.",
    "3-2":
      "Canalisez cette frustration positivement : rangement, ménage, ou activité physique.",
    "3-3":
      "Prenez du recul avec des exercices de respiration ou un moment au calme.",
    "3-4":
      "Frustration et fatigue ne font pas bon ménage. Identifiez la source et faites une pause.",
    "3-5":
      "Trop de frustration vous épuise. Accordez-vous une vraie pause et de la bienveillance.",

    "4-1":
      "L'anxiété avec de l'énergie peut être canalisée : exercice doux, rangement, ou activité manuelle.",
    "4-2":
      "Utilisez cette énergie pour des activités apaisantes : yoga, dessin, ou musique douce.",
    "4-3":
      "Pratiquez la cohérence cardiaque ou la méditation pour apaiser l'anxiété.",
    "4-4":
      "Anxiété et fatigue sont épuisantes. Techniques de relaxation et repos sont prioritaires.",
    "4-5":
      "L'épuisement amplifie l'anxiété. Repos complet et éventuellement aide professionnelle.",

    "5-1":
      "Paradoxe fatigue/énergie ? Peut-être de l'excitation nerveuse. Privilégiez le calme.",
    "5-2":
      "Fatigue mais encore de l'énergie : activités calmes comme lecture ou podcasts.",
    "5-3":
      "Fatigue modérée : accordez-vous des micro-pauses et des activités ressourçantes.",
    "5-4": "Grande fatigue : repos, hydratation et sommeil sont vos priorités.",
    "5-5":
      "Épuisement total : arrêtez-vous, reposez-vous complètement. Demandez de l'aide si nécessaire.",

    "6-1":
      "État idéal ! Profitez de ce calme énergique pour des activités créatives ou sociales.",
    "6-2":
      "Calme et énergique : parfait pour apprendre quelque chose de nouveau ou aider les autres.",
    "6-3":
      "Belle sérénité : maintenez cet état avec des activités qui vous nourrissent.",
    "6-4":
      "Calme mais fatigué(e) : repos actif avec méditation ou lecture douce.",
    "6-5":
      "Calme malgré l'épuisement : votre sagesse vous guide vers le repos nécessaire.",
  };

  return (
    adviceMap[`${mood.id}-${energy.id}`] ||
    "Prenez soin de vous et écoutez vos besoins."
  );
};

export default function MoodTrackerScreen() {
  const [selectedAutistMood, setSelectedAutistMood] = useState<any>(null);
  const [selectedCompanionMood, setSelectedCompanionMood] = useState<any>(null);
  const [showAdvice, setShowAdvice] = useState(false);
  const [geminiAdvice, setGeminiAdvice] = useState<string>("");
  const [isGeminiLoading, setIsGeminiLoading] = useState(false);

  const handleGetAdvice = async () => {
    if (selectedAutistMood && selectedCompanionMood) {
      setIsGeminiLoading(true);

      const prompt = `Je suis accompagnant d'une personne autiste. Voici la situation actuelle :

PERSONNE AUTISTE :
- Humeur : ${selectedAutistMood.name}

ACCOMPAGNANT :
- Humeur : ${selectedCompanionMood.name}

Peux-tu me donner un conseil bienveillant et pratique pour gérer cette situation ? Le conseil doit tenir compte de l'état des deux personnes et proposer des actions concrètes pour favoriser le bien-être de tous les deux.`;

      try {
        const advice = await makeCallToGemini(prompt);
        setGeminiAdvice(advice);
        setShowAdvice(true);
      } catch (error) {
        console.error("Erreur Gemini:", error);
        Alert.alert(
          "Erreur",
          "Impossible d'obtenir un conseil de Gemini. Vérifiez votre configuration API."
        );
      } finally {
        setIsGeminiLoading(false);
      }
    } else {
      Alert.alert(
        "Sélection incomplète",
        "Veuillez sélectionner l'humeur pour les deux personnes"
      );
    }
  };

  const resetSelection = () => {
    setSelectedAutistMood(null);
    setSelectedCompanionMood(null);
    setShowAdvice(false);
    setGeminiAdvice("");
  };
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: "#A1CEDC", dark: "#1D3D47" }}
      headerImage={
        <Image
          source={require("@/assets/images/MainStyleIndex.png")}
          style={styles.reactLogo}
        />
      }
    >
      <ThemedView style={styles.titleContainer}>
        <ThemedText
          type="title"
          style={{
            fontFamily: Fonts.rounded,
          }}
        >
          Évaluation des humeurs
        </ThemedText>
      </ThemedView>

      {/* Section pour la personne autiste */}
      <ThemedView style={styles.personSection}>
        <ThemedText type="subtitle" style={styles.personTitle}>
          🧠 Personne autiste
        </ThemedText>

        <ThemedView style={styles.sectionContainer}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            😊 Humeur actuelle
          </ThemedText>
          <View style={styles.optionsGrid}>
            {moods.map((mood) => (
              <TouchableOpacity
                key={mood.id}
                style={[
                  styles.optionCard,
                  { backgroundColor: mood.color + "30" },
                  selectedAutistMood?.id === mood.id && {
                    borderColor: mood.color,
                    borderWidth: 3,
                    backgroundColor: mood.color + "50",
                  },
                ]}
                onPress={() => setSelectedAutistMood(mood)}
              >
                <ThemedText style={styles.emoji}>{mood.emoji}</ThemedText>
                <ThemedText style={styles.optionText}>{mood.name}</ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        </ThemedView>
      </ThemedView>

      {/* Section pour l'accompagnant */}
      <ThemedView style={styles.personSection}>
        <ThemedText type="subtitle" style={styles.personTitle}>
          🤝 Accompagnant
        </ThemedText>

        <ThemedView style={styles.sectionContainer}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            😊 Votre humeur
          </ThemedText>
          <View style={styles.optionsGrid}>
            {moods.map((mood) => (
              <TouchableOpacity
                key={mood.id}
                style={[
                  styles.optionCard,
                  { backgroundColor: mood.color + "30" },
                  selectedCompanionMood?.id === mood.id && {
                    borderColor: mood.color,
                    borderWidth: 3,
                    backgroundColor: mood.color + "50",
                  },
                ]}
                onPress={() => setSelectedCompanionMood(mood)}
              >
                <ThemedText style={styles.emoji}>{mood.emoji}</ThemedText>
                <ThemedText style={styles.optionText}>{mood.name}</ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        </ThemedView>
      </ThemedView>

      <ThemedView style={styles.actionContainer}>
        <TouchableOpacity
          style={[
            styles.adviceButton,
            isGeminiLoading && styles.adviceButtonDisabled,
          ]}
          onPress={handleGetAdvice}
          disabled={isGeminiLoading}
        >
          {isGeminiLoading ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <ThemedText style={styles.buttonText}>
              🤖 Obtenir un conseil Gemini
            </ThemedText>
          )}
        </TouchableOpacity>

        {showAdvice && geminiAdvice && (
          <ThemedView style={styles.adviceContainer}>
            <ThemedText type="subtitle" style={styles.adviceTitle}>
              Conseil personnalisé de Gemini :
            </ThemedText>
            <ThemedText style={styles.adviceText}>{geminiAdvice}</ThemedText>
            <TouchableOpacity
              style={styles.resetButton}
              onPress={resetSelection}
            >
              <ThemedText style={styles.resetButtonText}>
                🔄 Nouvelle évaluation
              </ThemedText>
            </TouchableOpacity>
          </ThemedView>
        )}
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  reactLogo: {
    height: 488,
    width: 390,
    bottom: 0,
    left: 0,
    position: "absolute",
  },
  titleContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  personSection: {
    backgroundColor: "white",
    padding: 15,
    marginBottom: 20,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#b5d2ea",
  },
  personTitle: {
    textAlign: "center",
    marginBottom: 20,
    fontSize: 20,
    fontWeight: "700",
    color: "#333333",
  },
  sectionContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    textAlign: "center",
    marginBottom: 15,
    fontSize: 18,
  },
  optionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 10,
  },
  optionCard: {
    width: "48%",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
    marginBottom: 10,
    backgroundColor: "white",
  },
  emoji: {
    fontSize: 30,
    marginBottom: 8,
  },
  optionText: {
    textAlign: "center",
    fontSize: 14,
    fontWeight: "500",
  },
  actionContainer: {
    alignItems: "center",
    marginTop: 20,
  },
  adviceButton: {
    backgroundColor: "#ebb7b5",
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    marginBottom: 20,
  },
  adviceButtonDisabled: {
    backgroundColor: "#688196",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  adviceContainer: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#333333",
    width: "100%",
  },
  adviceTitle: {
    textAlign: "center",
    marginBottom: 15,
    color: "#333333",
  },
  adviceText: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
    marginBottom: 20,
    color: "#333333",
  },
  resetButton: {
    backgroundColor: "#ebee99",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    alignSelf: "center",
  },
  resetButtonText: {
    color: "#333333",
    fontSize: 14,
    fontWeight: "500",
  },
});
