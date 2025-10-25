import axios from 'axios';

// 📡 Configurar cliente base
const client = axios.create({
  baseURL: 'http://localhost:4000/api', // cambia si tu backend está en otra URL
});

export default client;
