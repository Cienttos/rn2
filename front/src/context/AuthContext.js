import React, { createContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import client from '../api/client';

const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  const getProfile = useCallback(async () => {
    try {
      const { data } = await client.get('/profile');
      setUser(data);
    } catch (error) {
      console.error('Failed to fetch profile', error);
      // Si falla el perfil, podría ser un token inválido, así que cerramos sesión
      logout(); 
    }
  }, []);

  useEffect(() => {
    const loadStorageData = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('token');
        if (storedToken) {
          setToken(storedToken);
          client.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
          await getProfile();
        }
      } catch (error) {
        console.error('Failed to load token from storage', error);
      } finally {
        setLoading(false);
      }
    };

    loadStorageData();
  }, [getProfile]);

  const login = async (newToken) => {
    try {
      setToken(newToken);
      client.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      await AsyncStorage.setItem('token', newToken);
      await getProfile();
    } catch (error) {
      console.error('Failed to save token or fetch profile', error);
    }
  };

  const logout = async () => {
    try {
      setToken(null);
      setUser(null);
      delete client.defaults.headers.common['Authorization'];
      await AsyncStorage.removeItem('token');
    } catch (error) {
      console.error('Failed to remove token', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, setUser, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext, AuthProvider };
