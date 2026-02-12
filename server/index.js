require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const os = require('os'); // Kita gunakan folder TEMP bawaan Windows/Mac

const app = express();

// --- 1. MIDDLEWARE ---
app.use(cors());
app.use(express.json());

// --- 2. KONFIGURASI ---
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// --- SETTING MULTER (PENTING) ---
// Kita simpan file di folder sementara OS (os.tmpdir)
// Jadi TIDAK PERLU buat folder 'uploads' di dalam proyek.
const upload = multer({ dest: os.tmpdir() }); 

// --- 3. ROUTES ---

// Cek Server
app.get('/', (req, res) => {
  res.send('Backend Berjalan (Menggunakan System Temp Dir)');
});

// GET DATA
app.get('/api/kartu', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('kartu_ujian')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST DATA (TAMBAH)
app.post('/api/kartu', upload.single('foto'), async (req, res) => {
  try {
    const { nama, nomor_ujian, fakultas } = req.body;
    const file = req.file;

    if (!file) return res.status(400).json({ error: "Foto wajib diupload" });

    // 1. Upload ke Cloudinary (ambil dari folder temp)
    const cloudinaryResponse = await cloudinary.uploader.upload(file.path, {
      folder: 'kartu_ujian',
    });

    // 2. Hapus file dari folder temp komputer agar tidak menumpuk
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }

    // 3. Simpan link gambar ke Supabase
    const { data, error } = await supabase
      .from('kartu_ujian')
      .insert([{ nama, nomor_ujian, fakultas, foto_url: cloudinaryResponse.secure_url }])
      .select();

    if (error) throw error;
    res.status(201).json({ message: "Berhasil", data });

  } catch (err) {
    console.error("Error POST:", err);
    // Bersihkan file temp jika error
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ error: err.message });
  }
});

// PUT DATA (EDIT)
app.put('/api/kartu/:id', upload.single('foto'), async (req, res) => {
  const { id } = req.params;
  const { nama, nomor_ujian, fakultas } = req.body;
  const file = req.file;

  try {
    let updateData = { nama, nomor_ujian, fakultas };

    // Jika ada foto baru
    if (file) {
      const cloudinaryResponse = await cloudinary.uploader.upload(file.path, {
        folder: 'kartu_ujian',
      });
      // Hapus file temp
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      
      updateData.foto_url = cloudinaryResponse.secure_url;
    }

    const { data, error } = await supabase
      .from('kartu_ujian')
      .update(updateData)
      .eq('id', id)
      .select();

    if (error) throw error;
    res.json({ message: "Update berhasil", data });

  } catch (err) {
    console.error("Error PUT:", err);
    if (file && fs.existsSync(file.path)) fs.unlinkSync(file.path);
    res.status(500).json({ error: err.message });
  }
});

// DELETE DATA
app.delete('/api/kartu/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const { error } = await supabase.from('kartu_ujian').delete().eq('id', id);
    if (error) throw error;
    res.json({ message: "Terhapus" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;

// Jalankan app.listen 
app.listen(PORT, () => {
  console.log(`Server berjalan di port ${PORT}`);
});

// PENTING UNTUK VERCEL: Export app
module.exports = app;