import { supabase } from '../config/supabaseClient.js';

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return res.status(401).json({ error: 'No token provided' });

    const token = authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Invalid token format' });

    // Verificar token con Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return res.status(401).json({ error: 'Unauthorized' });

    req.user = user; // agregamos usuario al request
    next();
  } catch (err) {
    console.error('Error authenticating:', err);
    res.status(500).json({ error: 'Server error during authentication' });
  }
};
