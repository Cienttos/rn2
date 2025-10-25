// src/config/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

// ⚙️ Variables de entorno (Expo usa EXPO_PUBLIC_ para exponerlas)
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://TU_PROYECTO.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'TU_ANON_KEY';

// 🧩 Crear cliente de Supabase
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
