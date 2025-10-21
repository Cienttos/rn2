import React, { useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  Image,
} from "react-native";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";

// Cierra la ventana del navegador de autenticación al completar el proceso
WebBrowser.maybeCompleteAuthSession();

// --- TUS CREDENCIALES ---
const ANDROID_CLIENT_ID =
  "730063429671-1vsf56k9ekp88r2oev98s1g1hf9o1eem.apps.googleusercontent.com";
const WEB_CLIENT_ID =
  "730063429671-0i2mf0ackh0tsvs2tl03bmpv56ut23iu.apps.googleusercontent.com";

export default function App() {
  const [userInfo, setUserInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // 1. Hook de autenticación de Google
  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: ANDROID_CLIENT_ID,
    webClientId: WEB_CLIENT_ID,
    scopes: ["profile", "email"],
    redirectUri: Linking.createURL(""),
  });

  // DEBUG: muestra la URL de redirección al inicio
  useEffect(() => {
    if (request) {
      console.log("--- Configuración de Google Cloud ---");
      console.log(
        "URI de redirección que debes añadir en Google Cloud Console:"
      );
      console.log(request.redirectUri);
      console.log("------------------------------------");
    }
  }, [request]);

  // 2. Procesamiento de la Respuesta
  useEffect(() => {
    if (response?.type === "success") {
      const { authentication } = response;
      // Una vez tenemos el token de acceso, pedimos los datos del perfil
      getUserData(authentication.accessToken);
    } else if (response?.type === "error") {
      console.error("Google Auth Error:", response.error);
    }
  }, [response]);

  // 3. Obtener Datos del Perfil (usando el Access Token)
  const getUserData = async (token) => {
    setIsLoading(true);
    try {
      // Endpoint estándar de Google para obtener info de perfil
      const userResponse = await fetch(
        "https://www.googleapis.com/userinfo/v2/me",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const user = await userResponse.json();
      setUserInfo(user);
    } catch (error) {
      console.error("Error fetching user data:", error);
      setUserInfo(null);
    } finally {
      setIsLoading(false);
    }
  };

  // 4. Funciones de Interfaz
  const handleLogout = () => {
    setUserInfo(null);
  };

  const handleLogin = async () => {
    if (!request) return;
    try {
      // Lanza la ventana de login
      await promptAsync();
    } catch (error) {
      console.error("Login prompt failed:", error);
    }
  };

  // Renderizado Condicional
  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#4285F4" />
        <Text style={{ marginTop: 10 }}>Cargando datos...</Text>
      </View>
    );
  }

  if (userInfo) {
    // Interfaz de Perfil
    return (
      <View style={styles.container}>
        <View style={styles.profileCard}>
          <Text style={styles.title}>¡Bienvenido!</Text>
          {userInfo.picture && (
            <Image
              source={{ uri: userInfo.picture }}
              style={styles.profileImage}
            />
          )}
          <Text style={styles.name}>{userInfo.name}</Text>
          <Text style={styles.email}>{userInfo.email}</Text>
          <Pressable style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.buttonText}>Cerrar Sesión</Text>
          </Pressable>
        </View>
        <StatusBar style="auto" />
      </View>
    );
  }

  // Interfaz de Login
  return (
    <View style={styles.container}>
      <Text style={styles.welcomeText}>Inicia sesión con Google.</Text>
      <Pressable
        style={styles.loginButton}
        onPress={handleLogin}
        disabled={!request}
      >
        <Text style={styles.buttonText}>
          {request ? "Iniciar Sesión con Google" : "Configurando..."}
        </Text>
      </Pressable>
      <StatusBar style="auto" />
    </View>
  );
}

// Estilos
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: "300",
    marginBottom: 40,
    color: "#333",
  },
  loginButton: {
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    backgroundColor: "#4285F4",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  logoutButton: {
    marginTop: 25,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: "#DB4437",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  profileCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    padding: 30,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#333",
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 15,
    borderWidth: 3,
    borderColor: "#4285F4",
  },
  name: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 5,
    color: "#333",
  },
  email: {
    fontSize: 14,
    color: "#666",
    marginBottom: 10,
  },
});
