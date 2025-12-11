import { Image } from "expo-image";
import { Platform, StyleSheet, Dimensions } from "react-native";
import MapView, { Marker } from "react-native-maps";

import { HelloWave } from "@/components/hello-wave";
import ParallaxScrollView from "@/components/parallax-scroll-view";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Link } from "expo-router";

export default function HomeScreen() {
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: "#b5d2ea", dark: "#333333" }}
      headerImage={
        <Image
          source={require("@/assets/images/MainStyleIndex.png")}
          style={styles.reactLogo}
        />
      }
    >
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Tessa</ThemedText>
        <HelloWave />
      </ThemedView>

      <ThemedView style={styles.mapContainer}>
        <ThemedText type="subtitle" style={styles.mapTitle}>
          Localisation des services
        </ThemedText>
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: 48.8566,
            longitude: 2.3522,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          }}
        >
          <Marker
            coordinate={{ latitude: 48.8566, longitude: 2.3522 }}
            title="Centre de ressources autisme"
            description="Service d'accompagnement spécialisé"
            pinColor="red"
          />
          <Marker
            coordinate={{ latitude: 48.8606, longitude: 2.3376 }}
            title="Centre médical spécialisé"
            description="Consultations et diagnostics"
            pinColor="blue"
          />
          <Marker
            coordinate={{ latitude: 48.8529, longitude: 2.3599 }}
            title="Établissement d'accueil"
            description="Activités et accompagnement"
            pinColor="green"
          />
        </MapView>
      </ThemedView>

      <ThemedView style={styles.stepContainer}>
        <Link href="/multiTextPdf" asChild>
          <ThemedText type="subtitle" style={styles.linkText}>
            📄 Extraire texte des PDFs
          </ThemedText>
        </Link>

        <Link href="/modal" asChild>
          <ThemedText type="subtitle" style={styles.linkText}>
            📋 Voir les outils
          </ThemedText>
        </Link>
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 20,
  },
  stepContainer: {
    gap: 16,
    marginBottom: 8,
    marginTop: 20,
  },
  reactLogo: {
    height: 488,
    width: 390,
    bottom: 0,
    left: 0,
    position: "absolute",
  },
  mapContainer: {
    marginBottom: 20,
  },
  mapTitle: {
    marginBottom: 10,
    textAlign: "center",
  },
  map: {
    width: Dimensions.get("window").width - 40,
    height: 300,
    borderRadius: 10,
  },
  linkText: {
    textAlign: "center",
    padding: 15,
    backgroundColor: "white",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#333333",
    color: "#333333",
  },
});
