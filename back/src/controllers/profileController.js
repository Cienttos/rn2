import { supabaseAdmin as supabase } from "../config/supabaseAdmin.js";
import multer from "multer";
import path from "path";
// import fs from 'fs'; // 🚨 YA NO ES NECESARIO IMPORTAR 'fs'

// 📸 Configuración de Multer: USAR MEMORY STORAGE para obtener el buffer directamente
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
export const uploadMiddleware = upload.single("avatar"); // El nombre del campo debe ser 'avatar'

// 🌐 URL por defecto si no hay avatar
const DEFAULT_AVATAR_URL = "https://example.com/default-avatar.png"; // 🔹 reemplazá con tu imagen real

// =======================================================
// 🟢 OBTENER PERFIL
// =======================================================
export const getProfile = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { id } = req.user; // Buscar el perfil en la tabla `profiles`

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("id, full_name, username, avatar_url, phone, address")
      .eq("id", id)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("Supabase select error:", error.message);
      return res.status(400).json({ error: error.message });
    } // Prioridad del avatar: perfil → default

    const avatar = profile?.avatar_url || DEFAULT_AVATAR_URL;

    res.status(200).json({
      id,
      email: req.user.email,
      full_name: profile?.full_name || req.user.user_metadata.full_name || "",
      username: profile?.username || "",
      phone: profile?.phone || "",
      address: profile?.address || "",
      avatar_url: avatar,
    });
  } catch (err) {
    console.error("GetProfile Error:", err);
    res.status(500).json({ error: "Server error fetching profile" });
  }
};

// =======================================================
// 🟡 ACTUALIZAR PERFIL
// =======================================================
export const updateProfile = async (req, res) => {
  console.log("Backend: Recibida solicitud para actualizar perfil.");
  try {
    if (!req.user) {
      console.log("Backend: Usuario no autenticado.");
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { id } = req.user;
    const { full_name, username, phone, address } = req.body;
    console.log("Backend: Datos recibidos del body:", req.body);

    let avatarUrl = null;

    if (req.file) {
      console.log("Backend: Archivo de imagen recibido:", req.file.originalname);
      const fileExt = path.extname(req.file.originalname);
      const fileBuffer = req.file.buffer;

      console.log(`Backend: Eliminando avatares antiguos para el usuario ${id}...`);
      const { data: existingFiles, error: listError } = await supabase.storage
        .from("avatars")
        .list(id, { limit: 10 });

      if (listError) {
        console.error("Backend: Error al listar avatares antiguos:", listError.message);
      }

      if (existingFiles && existingFiles.length > 0) {
        const filesToRemove = existingFiles.map((file) => `${id}/${file.name}`);
        console.log("Backend: Avatares para eliminar:", filesToRemove);
        const { error: removeError } = await supabase.storage
          .from("avatars")
          .remove(filesToRemove);
        if (removeError) {
          console.error("Backend: No se pudieron eliminar los avatares antiguos:", removeError.message);
        } else {
          console.log("Backend: Avatares antiguos eliminados correctamente.");
        }
      }

      const newFileName = `${id}/avatar_${Date.now()}${fileExt}`;
      console.log(`Backend: Subiendo nuevo avatar: ${newFileName}`);
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(newFileName, fileBuffer, {
          contentType: req.file.mimetype,
          upsert: false,
        });

      if (uploadError) {
        console.error("Backend: Error al subir el avatar:", uploadError.message);
        return res.status(400).json({ error: uploadError.message });
      }

      console.log("Backend: Avatar subido correctamente. Datos:", uploadData);
      const { data: publicUrlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(uploadData.path);

      avatarUrl = publicUrlData.publicUrl;
      console.log("Backend: URL pública del avatar:", avatarUrl);
    }

    const updateData = {
      full_name,
      username,
      phone,
      address,
      updated_at: new Date(),
    };

    if (avatarUrl) {
      updateData.avatar_url = avatarUrl;
    }
    console.log("Backend: Datos para actualizar en la base de datos:", updateData);

    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .upsert({ id, ...updateData })
      .select()
      .single();

    if (profileError) {
      console.error("Backend: Error al actualizar el perfil en la base de datos:", profileError.message);
      return res.status(400).json({ error: profileError.message });
    }

    console.log("Backend: Perfil actualizado en la base de datos:", profileData);

    const finalAvatar =
      avatarUrl ||
      (profileData && profileData.avatar_url) ||
      DEFAULT_AVATAR_URL;

    res.status(200).json({
      message: "Profile updated successfully",
      data: {
        ...profileData,
        avatar_url: finalAvatar,
      },
    });
  } catch (err) {
    console.error("Backend: Error en updateProfile:", err);
    res.status(500).json({ error: "Server error updating profile" });
  }
};
