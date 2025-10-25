import { supabase } from '../config/supabaseClient.js';
import { setAuthCookies, clearAuthCookies } from '../utils/cookies.js';
import https from 'https'

// --- Helper para descargar imagen ---
const downloadImage = (url) => new Promise((resolve, reject) => {
  https.get(url, (res) => {
    if (res.statusCode < 200 || res.statusCode >= 300) {
      return reject(new Error(`Failed to download image, status code: ${res.statusCode}`));
    }
    const chunks = [];
    res.on('data', (chunk) => chunks.push(chunk));
    res.on('end', () => resolve(Buffer.concat(chunks)));
  }).on('error', (err) => reject(err));
});


// Registro de un nuevo usuario
export const register = async (req, res) => {
  const { email, password, ...userData } = req.body;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: userData, // Guarda metadatos adicionales como nombre, etc.
    },
  });

  if (error) return res.status(400).json({ error: error.message });

  return res.status(201).json({ message: 'User registered. Please check your email to verify.', data });
};

// Inicio de sesión con email y contraseña
export const login = async (req, res) => {
  const { email, password } = req.body;

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) return res.status(400).json({ error: error.message });

  setAuthCookies(res, data.session);
  res.status(200).json({ message: 'Logged in successfully', user: data.user, token: data.session.access_token });
};

// Inicio de sesión con proveedores OAuth
export const oauth = async (req, res) => {
  const { provider } = req.params;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `http://localhost:4000/api/auth/callback` // URL de callback tras el login
    }
  });

  if (error) return res.status(400).json({ error: error.message });

  res.redirect(data.url);
};

// Cierre de sesión
export const logout = async (req, res) => {
  const { error } = await supabase.auth.signOut();

  if (error) return res.status(400).json({ error: error.message });

  clearAuthCookies(res);
  res.status(200).json({ message: 'Logged out successfully' });
};

// Inicio de sesión con Google ID Token desde el cliente
export const googleSignIn = async (req, res) => {
  const { id_token, nonce } = req.body;

  if (!id_token) {
    return res.status(400).json({ error: 'No id_token provided.' });
  }

  const { data: sessionData, error: signInError } = await supabase.auth.signInWithIdToken({
    provider: 'google',
    token: id_token,
    nonce: nonce,
  });

  if (signInError) {
    return res.status(400).json({ error: `Sign-in failed: ${signInError.message}` });
  }

  if (!sessionData || !sessionData.session) {
    return res.status(400).json({ error: 'Invalid token or session could not be created.' });
  }

  const { user } = sessionData;

  try {
    let { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Error checking for profile:', profileError.message);
      return res.status(500).json({ error: 'Could not verify user profile.' });
    }

    if (!profile) {
      let avatarUrl = user.user_metadata.avatar_url;
      try {
        const googleAvatarUrl = user.user_metadata.avatar_url;
        if (googleAvatarUrl) {
          const imageBuffer = await downloadImage(googleAvatarUrl);
          // Guardar en una carpeta específica del usuario para consistencia
          const fileName = `${user.id}/avatar.jpg`;
          
          const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(fileName, imageBuffer, { 
              contentType: 'image/jpeg', 
              upsert: true // `upsert` es ideal aquí
            });

          if (uploadError) throw uploadError;

          const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
          avatarUrl = publicUrlData.publicUrl;
        }
      } catch (e) {
        console.error('Failed to download or upload Google avatar, falling back to original URL:', e.message);
      }

      const { error: insertError } = await supabase.from('profiles').insert({
        id: user.id,
        full_name: user.user_metadata.full_name,
        avatar_url: avatarUrl,
        username: user.email.split('@')[0],
      });

      if (insertError) {
        console.error('Could not create profile for new user:', insertError.message);
        return res.status(500).json({ error: 'Failed to create user profile after sign-in.' });
      }
    }

    setAuthCookies(res, sessionData.session);
    return res.status(200).json({
      message: 'Logged in successfully',
      user: user,
      token: sessionData.session.access_token,
    });

  } catch (e) {
    console.error('Unexpected error during profile handling:', e.message);
    return res.status(500).json({ error: 'An unexpected error occurred.' });
  }
};
