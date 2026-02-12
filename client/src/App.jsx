import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import './App.css';

function App() {
  // --- KONFIGURASI URL API (PENTING UNTUK VERCEL) ---
  // Jika di Vercel, dia pakai VITE_API_URL. Jika di local, pakai localhost:5000
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const [kartu, setKartu] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editId, setEditId] = useState(null);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    nama: '',
    nomor_ujian: '',
    fakultas: '',
    foto: null
  });

  // 1. FETCH DATA (READ)
  useEffect(() => {
    fetchKartu();
  }, []);

  const fetchKartu = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/kartu`);
      setKartu(res.data);
    } catch (error) {
      console.error("Gagal mengambil data:", error);
      // Jangan tampilkan alert jika error koneksi awal agar tidak mengganggu
    }
  };

  // Handle Perubahan Input Teks
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle Perubahan Input File
  const handleFileChange = (e) => {
    setFormData({ ...formData, foto: e.target.files[0] });
  };

  // Mode Edit: Isi form dengan data yang dipilih
  const handleEdit = (item) => {
    setEditId(item.id);
    setFormData({
      nama: item.nama,
      nomor_ujian: item.nomor_ujian,
      fakultas: item.fakultas,
      foto: null // Foto di-reset agar user tidak wajib upload ulang jika tidak ingin ganti
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Batal Edit
  const cancelEdit = () => {
    setEditId(null);
    setFormData({ nama: '', nomor_ujian: '', fakultas: '', foto: null });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // 2. SUBMIT (CREATE / UPDATE)
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validasi: Foto wajib jika Data Baru. Opsional jika Edit.
    if (!editId && !formData.foto) {
      Swal.fire('Error', 'Silakan pilih pas foto terlebih dahulu', 'error');
      return;
    }

    setIsLoading(true);
    const data = new FormData();
    data.append('nama', formData.nama);
    data.append('nomor_ujian', formData.nomor_ujian);
    data.append('fakultas', formData.fakultas);
    
    // Hanya kirim foto jika user memilih file baru
    if (formData.foto) {
      data.append('foto', formData.foto);
    }

    try {
      if (editId) {
        // --- LOGIKA UPDATE (PUT) ---
        await axios.put(`${API_URL}/api/kartu/${editId}`, data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        Swal.fire({
          title: 'Berhasil!',
          text: 'Data mahasiswa berhasil diperbarui.',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
      } else {
        // --- LOGIKA CREATE (POST) ---
        await axios.post(`${API_URL}/api/kartu`, data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        Swal.fire({
          title: 'Berhasil!',
          text: 'Kartu ujian baru berhasil dibuat.',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
      }

      // Reset Form & Refresh Data
      fetchKartu();
      cancelEdit(); 

    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.error || "Terjadi kesalahan sistem";
      Swal.fire('Gagal', msg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // 3. DELETE (HAPUS)
  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Hapus Data?',
      text: "Data yang dihapus tidak bisa dikembalikan!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Ya, hapus!',
      cancelButtonText: 'Batal'
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(`${API_URL}/api/kartu/${id}`);
        Swal.fire('Terhapus!', 'Data mahasiswa telah dihapus.', 'success');
        fetchKartu();
      } catch (error) {
        console.error(error);
        Swal.fire('Error', 'Gagal menghapus data.', 'error');
      }
    }
  }

  return (
    <div className="container">
      <header className="header">
        <h1>🎓 Sistem Kartu Ujian</h1>
        <p>Kartu Ujian Dengan Sistem Database Supabase dan Cloudinary</p>
      </header>

      <div className="main-content">
        {/* --- FORM INPUT (KIRI) --- */}
        <div className="form-container">
          <h3>{editId ? '📝 Edit Data Mahasiswa' : '➕ Tambah Mahasiswa Baru'}</h3>
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Nama Lengkap</label>
              <input 
                type="text" 
                name="nama" 
                value={formData.nama} 
                onChange={handleChange} 
                placeholder="Contoh: Budi Santoso"
                required 
              />
            </div>
            
            <div className="form-group">
              <label>NIM / Nomor Ujian</label>
              <input 
                type="text" 
                name="nomor_ujian" 
                value={formData.nomor_ujian} 
                onChange={handleChange} 
                placeholder="Contoh: 2024001"
                required 
              />
            </div>

            <div className="form-group">
              <label>Fakultas</label>
              <select name="fakultas" value={formData.fakultas} onChange={handleChange} required>
                <option value="">-- Pilih Fakultas --</option>
                <option value="Fakultas Teknik">Fakultas Teknik</option>
                <option value="Fakultas Ekonomi & Bisnis">Fakultas Ekonomi & Bisnis</option>
                <option value="Fakultas Ilmu Komputer">Fakultas Ilmu Komputer</option>
                <option value="Fakultas Kedokteran">Fakultas Kedokteran</option>
                <option value="Fakultas Psikologi">Fakultas Psikologi</option>
                <option value="Fakultas Ilmu Komunikasi">Fakultas Ilmu Komunikasi</option>
              </select>
            </div>

            <div className="form-group">
              <label>Pas Foto {editId && <small style={{color:'orange'}}>(Upload hanya jika ingin mengganti)</small>}</label>
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileChange} 
                accept="image/*"
                required={!editId} // Wajib hanya jika BUKAN mode edit
              />
            </div>

            <div className="button-group">
              <button type="submit" disabled={isLoading} className="btn-submit">
                {isLoading ? 'Sedang Upload...' : (editId ? 'Update Data' : 'Simpan Data')}
              </button>
              
              {editId && (
                <button type="button" onClick={cancelEdit} className="btn-cancel">
                  Batal
                </button>
              )}
            </div>
          </form>
        </div>

        {/* --- LIST KARTU (KANAN) --- */}
        <div className="card-grid">
          {kartu.length === 0 ? (
            <p className="empty-state">Belum ada data mahasiswa.</p>
          ) : (
            kartu.map((item) => (
              <div key={item.id} className="card">
                <div className="card-header">
                  <span className="badge-fakultas">{item.fakultas}</span>
                </div>
                <div className="card-img-wrapper">
                  <img src={item.foto_url} alt={item.nama} loading="lazy" />
                </div>
                <div className="card-body">
                  <h4>{item.nama}</h4>
                  <p className="nomor-ujian">NIM: {item.nomor_ujian}</p>
                </div>
                <div className="card-footer">
                  <button onClick={() => handleEdit(item)} className="btn-edit">Edit</button>
                  <button onClick={() => handleDelete(item.id)} className="btn-delete">Hapus</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default App;