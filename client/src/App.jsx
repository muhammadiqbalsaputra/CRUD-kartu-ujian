import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import './App.css';

function App() {
  // CONFIG: URL BACKEND (Kita arahkan ke Port 5000)
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

  // Load Data saat aplikasi dibuka
  useEffect(() => {
    fetchKartu();
  }, []);

  const fetchKartu = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/kartu`);
      setKartu(res.data);
    } catch (error) {
      console.error("Gagal koneksi ke server:", error);
      // Opsional: Tampilkan alert jika backend mati
      // Swal.fire('Error', 'Gagal terhubung ke server backend', 'error');
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setFormData({ ...formData, foto: e.target.files[0] });
  };

  const handleEdit = (item) => {
    setEditId(item.id);
    setFormData({
      nama: item.nama,
      nomor_ujian: item.nomor_ujian,
      fakultas: item.fakultas,
      foto: null 
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditId(null);
    setFormData({ nama: '', nomor_ujian: '', fakultas: '', foto: null });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!editId && !formData.foto) {
      Swal.fire('Error', 'Silakan pilih foto terlebih dahulu', 'warning');
      return;
    }

    setIsLoading(true);
    const data = new FormData();
    data.append('nama', formData.nama);
    data.append('nomor_ujian', formData.nomor_ujian);
    data.append('fakultas', formData.fakultas);
    if (formData.foto) data.append('foto', formData.foto);

    try {
      if (editId) {
        await axios.put(`${API_URL}/api/kartu/${editId}`, data);
        Swal.fire('Berhasil', 'Data berhasil diperbarui', 'success');
      } else {
        await axios.post(`${API_URL}/api/kartu`, data);
        Swal.fire('Berhasil', 'Kartu berhasil dibuat', 'success');
      }
      fetchKartu();
      cancelEdit();
    } catch (error) {
      console.error(error);
      Swal.fire('Gagal', 'Terjadi kesalahan sistem', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Yakin hapus?',
      text: "Data tidak bisa kembali!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, Hapus',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#d33'
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(`${API_URL}/api/kartu/${id}`);
        Swal.fire('Terhapus!', 'Data berhasil dihapus.', 'success');
        fetchKartu();
      } catch (error) {
        Swal.fire('Error', 'Gagal menghapus data', 'error');
      }
    }
  }

  return (
    <div className="container">
      <header className="header">
        <h1>🎓 Sistem Kartu Ujian (Localhost)</h1>
      </header>

      <div className="main-content">
        {/* FORM */}
        <div className="form-container">
          <h3>{editId ? 'Edit Data' : 'Tambah Mahasiswa'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Nama</label>
              <input type="text" name="nama" value={formData.nama} onChange={handleChange} required placeholder="Nama Lengkap"/>
            </div>
            <div className="form-group">
              <label>NIM</label>
              <input type="text" name="nomor_ujian" value={formData.nomor_ujian} onChange={handleChange} required placeholder="Nomor Ujian/NIM"/>
            </div>
            <div className="form-group">
              <label>Fakultas</label>
              <select name="fakultas" value={formData.fakultas} onChange={handleChange} required>
                <option value="">-- Pilih Fakultas --</option>
                <option value="Fakultas Teknik">Fakultas Teknik</option>
                <option value="Fakultas Ekonomi">Fakultas Ekonomi</option>
                <option value="Fakultas Ilmu Komputer">Fakultas Ilmu Komputer</option>
                <option value="Fakultas Kedokteran">Fakultas Kedokteran</option>
              </select>
            </div>
            <div className="form-group">
              <label>Foto</label>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" required={!editId} />
            </div>
            <div className="button-group">
              <button type="submit" disabled={isLoading} className="btn-submit">
                {isLoading ? 'Loading...' : (editId ? 'Update' : 'Simpan')}
              </button>
              {editId && <button type="button" onClick={cancelEdit} className="btn-cancel">Batal</button>}
            </div>
          </form>
        </div>

        {/* LIST */}
        <div className="card-grid">
          {kartu.length === 0 ? <p className="empty-state">Data kosong.</p> : kartu.map((item) => (
            <div key={item.id} className="card">
              <div className="card-header"><span className="badge-fakultas">{item.fakultas}</span></div>
              <div className="card-img-wrapper"><img src={item.foto_url} alt={item.nama} /></div>
              <div className="card-body">
                <h4>{item.nama}</h4>
                <p>NIM: {item.nomor_ujian}</p>
              </div>
              <div className="card-footer">
                <button onClick={() => handleEdit(item)} className="btn-edit">Edit</button>
                <button onClick={() => handleDelete(item.id)} className="btn-delete">Hapus</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;