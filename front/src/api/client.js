import axios from 'axios';

// 📡 Configurar cliente base para apuntar al backend en Vercel
const client = axios.create({
  baseURL: 'https://rn2.vercel.app/api',
});

export default client;