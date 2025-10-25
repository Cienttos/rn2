const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production', // Solo secure en producción
  sameSite: 'lax',
  maxAge: 24 * 60 * 60 * 1000, // 1 día
};

export const setAuthCookies = (res, session) => {
  res.cookie('sb-access-token', session.access_token, cookieOptions);
  res.cookie('sb-refresh-token', session.refresh_token, cookieOptions);
};

export const clearAuthCookies = (res) => {
  res.clearCookie('sb-access-token', cookieOptions);
  res.clearCookie('sb-refresh-token', cookieOptions);
};
