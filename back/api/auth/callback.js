
import { supabaseAdmin } from "../../lib/supabaseAdmin.js";

export default async function handler(req, res) {
  const { code } = req.query;

  if (!code) {
    return res.status(400).json({ error: "El código de autorización de Google es requerido." });
  }

  // Intercambia el código por una sesión de Supabase
  const { data, error } = await supabaseAdmin.auth.exchangeCodeForSession(String(code));

  if (error) {
    console.error('Error al intercambiar el código por la sesión:', error);
    return res.status(500).json({ error: 'No se pudo obtener la sesión de usuario.', details: error.message });
  }

  // Construye la URL para redirigir de vuelta a la app de Expo
  // Pasamos los tokens como parámetros para que la app los pueda usar.
  const { access_token, refresh_token } = data.session;
  const expoRedirectUrl = `exp://192.168.0.69:8081?access_token=${access_token}&refresh_token=${refresh_token}`;

  console.log('Redirigiendo a Expo:', expoRedirectUrl);
  res.redirect(307, expoRedirectUrl);
}
