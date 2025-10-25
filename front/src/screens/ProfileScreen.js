import React, { useState, useEffect, useContext } from "react";
import { View, StyleSheet, ScrollView, Image } from "react-native";
import {
  Avatar,
  Button,
  Card,
  Title,
  Paragraph,
  TextInput,
  ActivityIndicator,
  Text,
} from "react-native-paper";
import * as ImagePicker from "expo-image-picker";
import { AuthContext } from "../context/AuthContext";
import client from "../api/client";

const ProfileScreen = () => {
  const { logout, user, setUser } = useContext(AuthContext); // El estado de carga ahora es solo para las actualizaciones, no para la carga inicial
  const [isUpdating, setIsUpdating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState(""); // Estado para la URI de la imagen seleccionada

  const [imageUri, setImageUri] = useState(null); // Estado para los campos del formulario

  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState(""); // Sincronizar el estado del formulario con el usuario del contexto

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || "");
      setUsername(user.username || "");
      setPhone(user.phone || "");
      setAddress(user.address || "");
      setImageUri(user.avatar_url || null);
    }
  }, [user]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleUpdate = async () => {
    setIsUpdating(true);
    setError("");
    console.log("Frontend: Iniciando actualización de perfil...");

    try {
      const formData = new FormData();
      formData.append("full_name", fullName);
      formData.append("username", username);
      formData.append("phone", phone);
      formData.append("address", address);

      console.log("Frontend: imageUri:", imageUri);
      // Check if the imageUri is a new image (not the one from the server)
      if (imageUri && imageUri !== user.avatar_url) {
        // If it's a blob URL, fetch it
        if (imageUri.startsWith("blob:")) {
          const response = await fetch(imageUri);
          const blob = await response.blob();
          const filename = imageUri.split("/").pop();
          formData.append("avatar", blob, filename);
          console.log("Frontend: Imagen (blob) adjuntada:", { uri: imageUri, name: filename });
        } else if (imageUri.startsWith("file://")) { // Keep the old logic for native
          const filename = imageUri.split("/").pop();
          const type = `image/${filename.split(".").pop()}`;
          formData.append("avatar", { uri: imageUri, name: filename, type });
          console.log("Frontend: Imagen (file) adjuntada:", { uri: imageUri, name: filename, type });
        }
      }

      console.log("Frontend: Enviando datos:", formData);

      const res = await client.put("/profile", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      console.log("Frontend: Respuesta del servidor:", res.data);

      if (res.data && res.data.data) {
        setUser(res.data.data);
        setEditing(false);
        console.log("Frontend: Perfil actualizado correctamente.");
      }
    } catch (err) {
      console.error("Frontend: Error al actualizar el perfil:", err.response ? err.response.data : err.message);
      setError("Error al actualizar el perfil.");
    } finally {
      setIsUpdating(false);
    }
  }; // La carga inicial ahora es manejada por AuthContext

  if (!user) {
    return (
      <View style={styles.container_centered}>
        <ActivityIndicator animating={true} size="large" />
        <Text style={{ marginTop: 10 }}>Cargando perfil...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Card>
        <Card.Content style={styles.cardContent}>
          <Image source={{ uri: imageUri }} style={styles.avatarImage} />
          <Title style={styles.title}>
            {editing ? fullName : user.full_name}
          </Title>
          <Paragraph style={styles.username}>
            @{editing ? username : user.username}
          </Paragraph>
          {editing && (
            <Button mode="outlined" onPress={pickImage}>
              Cambiar Foto
            </Button>
          )}
        </Card.Content>
      </Card>
      <Card style={styles.card}>
        <Card.Title title="Información de Perfil" />
        <Card.Content>
          {editing ? (
            <>
              <TextInput
                label="Nombre Completo"
                value={fullName}
                onChangeText={setFullName}
                style={styles.input}
              />
              <TextInput
                label="Nombre de Usuario"
                value={username}
                onChangeText={setUsername}
                style={styles.input}
              />
              <TextInput
                label="Teléfono"
                value={phone}
                onChangeText={setPhone}
                style={styles.input}
                keyboardType="phone-pad"
              />
              <TextInput
                label="Dirección"
                value={address}
                onChangeText={setAddress}
                style={styles.input}
              />
            </>
          ) : (
            <>
              <Paragraph>
                <Text style={{ fontWeight: "bold" }}>Email:</Text> {user.email}
              </Paragraph>
              <Paragraph>
                <Text style={{ fontWeight: "bold" }}>Teléfono:</Text>
                {user.phone || "No especificado"}
              </Paragraph>
              <Paragraph>
                <Text style={{ fontWeight: "bold" }}>Dirección:</Text>
                {user.address || "No especificada"}
              </Paragraph>
            </>
          )}
          {error ? <Text style={styles.error}>{error}</Text> : null}
        </Card.Content>
        {/* Corregido: Se elimina React.Fragment para evitar el warning de `compact` */}
        <Card.Actions style={styles.cardActions}>
          {editing && (
            <Button onPress={() => setEditing(false)}>Cancelar</Button>
          )}
          {editing && (
            <Button
              onPress={handleUpdate}
              mode="contained"
              loading={isUpdating}
            >
              Guardar
            </Button>
          )}
          {!editing && <Button onPress={() => setEditing(true)}>Editar</Button>}
        </Card.Actions>
      </Card>
      <Button mode="outlined" onPress={logout} style={styles.logoutButton}>
        Cerrar Sesión
      </Button>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: "#f5f5f5",
  },
  container_centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 10,
    backgroundColor: "#f5f5f5",
  },
  card: {
    marginTop: 15,
  },
  cardContent: {
    alignItems: "center",
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
    backgroundColor: "#e0e0e0", // Color de fondo mientras carga la imagen
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
  },
  username: {
    fontSize: 16,
    color: "gray",
    marginBottom: 10,
  },
  input: {
    marginBottom: 10,
  },
  cardActions: {
    justifyContent: "flex-end",
  },
  logoutButton: {
    marginTop: 20,
    borderColor: "red",
    borderColor: "red",
  },
  error: {
    color: "red",
    marginTop: 10,
  },
});

export default ProfileScreen;
