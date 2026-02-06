import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2'; // Import SweetAlert2
import './App.css'; // Kita akan buat file CSS ini nanti

function App() {
  const [kartu, setKartu] = useState([]);
  const [isLoading, setIsLoading] = useState(false); // State untuk loading
  const fileInputRef = useRef(null); // Ref untuk reset input file

  const [formData, setFormData] = useState({
    nama: '',
    nomor_ujian: '',
    jurusan: '',
    foto: null
  });

  useEffect(() => {
    fetchKartu();
  }, []);

  const fetchKartu = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/kartu');
      setKartu(res.data);
    } catch (error) {
      console.error("Gagal mengambil data", error);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setFormData({ ...formData, foto: e.target.files[0] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validasi sederhana
    if (!formData.foto) {
      Swal.fire('Error', 'Silakan pilih foto terlebih dahulu', 'error');
      return;
    }

    setIsLoading(true); // Mulai loading
    const data = new FormData();
    data.append('nama', formData.nama);
    data.append('nomor_ujian', formData.nomor_ujian);
    data.append('jurusan', formData.jurusan);
    data.append('foto', formData.foto);

    try {
      await axios.post('http://localhost:5000/api/kartu', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      // Notifikasi Sukses
      Swal.fire({
        title: 'Berhasil!',
        text: 'Kartu Ujian berhasil dibuat.',
        icon: 'success',
        confirmButtonColor: '#3085d6',
      });

      // Reset Form
      setFormData({ nama: '', nomor_ujian: '', jurusan: '', foto: null });
      if (fileInputRef.current) fileInputRef.current.value = ""; // Reset input file visual
      
      fetchKartu(); // Refresh data

    } catch (error) {
      console.error(error);
      Swal.fire('Gagal', 'Terjadi kesalahan saat upload data.', 'error');
    } finally {
      setIsLoading(false); // Matikan loading
    }
  };

  const handleDelete = async (id) => {
    // Konfirmasi Hapus dengan SweetAlert
    const result = await Swal.fire({
      title: 'Apakah Anda yakin?',
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
        await axios.delete(`http://localhost:5000/api/kartu/${id}`);
        
        Swal.fire(
          'Terhapus!',
          'Data kartu ujian telah dihapus.',
          'success'
        );
        
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
        <p>Manajemen data peserta ujian dengan Supabase & Cloudinary</p>
      </header>

      <div className="main-content">
        {/* Kolom Kiri: Form Input */}
        <div className="form-container">
          <h3>Tambah Peserta Baru</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Nama Lengkap</label>
              <input 
                type="text" 
                name="nama" 
                value={formData.nama}
                placeholder="Contoh: Budi Santoso" 
                onChange={handleChange} 
                required 
              />
            </div>
            
            <div className="form-group">
              <label>Nomor Ujian</label>
              <input 
                type="text" 
                name="nomor_ujian" 
                value={formData.nomor_ujian}
                placeholder="Contoh: 2024-001" 
                onChange={handleChange} 
                required 
              />
            </div>

            <div className="form-group">
              <label>Jurusan</label>
              <select name="jurusan" value={formData.jurusan} onChange={handleChange} required>
                <option value="">-- Pilih Jurusan --</option>
                <option value="IPA">Ilmu Pengetahuan Alam</option>
                <option value="IPS">Ilmu Pengetahuan Sosial</option>
                <option value="Bahasa">Bahasa & Sastra</option>
                <option value="Teknik">Teknik Komputer</option>
              </select>
            </div>

            <div className="form-group">
              <label>Pas Foto</label>
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileChange} 
                accept="image/*"
                required 
              />
            </div>

            <button type="submit" disabled={isLoading} className="btn-submit">
              {isLoading ? 'Mengupload...' : 'Simpan Data'}
            </button>
          </form>
        </div>

        {/* Kolom Kanan: List Kartu */}
        <div className="card-grid">
          {kartu.length === 0 ? (
            <p className="empty-state">Belum ada data peserta.</p>
          ) : (
            kartu.map((item) => (
              <div key={item.id} className="card">
                <div className="card-header">
                  <span className="badge-jurusan">{item.jurusan}</span>
                </div>
                <div className="card-img-wrapper">
                  <img src={item.foto_url} alt={item.nama} />
                </div>
                <div className="card-body">
                  <h4>{item.nama}</h4>
                  <p className="nomor-ujian">{item.nomor_ujian}</p>
                </div>
                <div className="card-footer">
                  <button onClick={() => handleDelete(item.id)} className="btn-delete">
                    Hapus
                  </button>
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