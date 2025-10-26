
import { supabaseAdmin } from "../../lib/supabaseAdmin.js";

export default async function handler(req, res) {
  // La URL a la que Google debe volver DESPUÉS de que el usuario acepte.
  // Esta es la URL de nuestro propio backend.
  const redirectTo = `https://rn2-5pcjjp3ld-cienttos-projects.vercel.app/api/auth/callback`;

  const { data, error } = await supabaseAdmin.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
    },
  });

  if (error) {
    console.error('Error al generar la URL de OAuth:', error);
    return res.status(500).json({ error: 'No se pudo iniciar sesión con Google.', details: error.message });
  }

  // Redireccionamos al usuario a la URL de Google para que inicie sesión.
  res.redirect(302, data.url);
}
