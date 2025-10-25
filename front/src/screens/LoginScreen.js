
import React, { useState, useContext, useEffect, useRef } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { TextInput, Button, Title, Subheading, Text } from 'react-native-paper';
import { AuthContext } from '../context/AuthContext';
import client from '../api/client';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import * as Crypto from 'expo-crypto';

// Esto es necesario para que el flujo de autenticación funcione en la web.
WebBrowser.maybeCompleteAuthSession();

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useContext(AuthContext);

  // --- Configuración de Google Sign-In ---
  const nonceRef = useRef(null);

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: '730063429671-0i2mf0ackh0tsvs2tl03bmpv56ut23iu.apps.googleusercontent.com',
  });

  useEffect(() => {
    const handleGoogleSignIn = async (id_token) => {
      try {
        console.log('Sending nonce to backend:', nonceRef.current);
        const res = await client.post('/auth/google-signin', { 
          id_token, 
          nonce: nonceRef.current
        });
        if (res.data && res.data.token) {
          await login(res.data.token);
        } else {
          setError('Respuesta inválida del servidor tras login con Google.');
        }
      } catch (err) {
        const message = err.response?.data?.error || 'Error en el inicio de sesión con Google.';
        setError(message);
        console.error(err);
      }
    };

    if (response?.type === 'success') {
      const { id_token } = response.params;
      handleGoogleSignIn(id_token);
    }
  }, [response]);

  const handleGoogleButtonPress = async () => {
    const digest = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      Math.random().toString()
    );
    nonceRef.current = digest;
    promptAsync({ nonce: digest });
  };
  // --- Fin de Configuración de Google Sign-In ---

  const handleLogin = async () => {
    setError('');
    if (!email || !password) {
      setError('Por favor, completa todos los campos.');
      return;
    }
    try {
      const res = await client.post('/auth/login', { email, password });
      if (res.data && res.data.token) {
        await login(res.data.token);
      } else {
        setError('Respuesta inválida del servidor');
      }
    } catch (err) {
      const message = err.response?.data?.error || 'Error al iniciar sesión.';
      setError(message);
      console.error(err);
    }
  };

  return (
    <View style={styles.container}>
      <Title style={styles.title}>Bienvenido</Title>
      <Subheading style={styles.subtitle}>Inicia sesión para continuar</Subheading>
      
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TextInput
        label="Email"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        label="Contraseña"
        value={password}
        onChangeText={setPassword}
        style={styles.input}
        secureTextEntry
      />
      <Button mode="contained" onPress={handleLogin} style={styles.button}>
        Iniciar Sesión
      </Button>
      <Button 
        mode="contained" 
        icon="google" 
        onPress={handleGoogleButtonPress} 
        style={styles.googleButton}
        disabled={!request}
      >
        Iniciar Sesión con Google
      </Button>
      <Button onPress={() => navigation.navigate('Register')} style={styles.buttonText}>
        ¿No tienes cuenta? Regístrate
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 20,
    color: 'gray',
  },
  input: {
    marginBottom: 15,
  },
  button: {
    marginTop: 10,
    paddingVertical: 5,
  },
  googleButton: {
    marginTop: 15,
    backgroundColor: '#4285F4',
    paddingVertical: 5,
  },
  buttonText: {
    marginTop: 20,
  },
  error: {
    color: 'red',
    textAlign: 'center',
    marginBottom: 10,
  },
});

export default LoginScreen;
