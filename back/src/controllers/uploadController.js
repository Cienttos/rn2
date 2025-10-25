import { supabase } from '../config/supabaseClient.js';
import { createWorker } from 'tesseract.js';

// Subir archivo general
export const uploadFile = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });

    const file = req.file;
    const fileName = `${req.user.id}/${Date.now()}_${file.originalname}`;

    const { data, error } = await supabase.storage
      .from('uploads')
      .upload(fileName, file.buffer, { contentType: file.mimetype });

    if (error) return res.status(500).json({ error: error.message });

    const { data: { publicUrl } } = supabase.storage.from('uploads').getPublicUrl(fileName);

    res.status(200).json({ message: 'File uploaded successfully', url: publicUrl });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error uploading file' });
  }
};

// Escanear texto de imagen
export const scanImage = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No image uploaded for scanning.' });

    const worker = await createWorker('eng');
    const { data: { text } } = await worker.recognize(req.file.buffer);
    await worker.terminate();

    res.status(200).json({ text });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error scanning image' });
  }
};
