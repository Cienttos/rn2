
// Las cabeceras CORS ahora se manejan en vercel.json
export default function handler(req, res) {
  res.status(200).json({ status: "OK", message: "API funcionando correctamente 🚀" });
}
