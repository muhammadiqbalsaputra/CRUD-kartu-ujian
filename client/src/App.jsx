import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import './App.css';

function App() {
  const [kartu, setKartu] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editId, setEditId] = useState(null);
  const fileInputRef = useRef(null);

  // UBAH STATE: jurusan -> fakultas
  const [formData, setFormData] = useState({
    nama: '',
    nomor_ujian: '',
    fakultas: '',
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

  const handleEdit = (item) => {
    setEditId(item.id);
    setFormData({
      nama: item.nama,
      nomor_ujian: item.nomor_ujian,
      fakultas: item.fakultas, // Ambil data fakultas
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
      Swal.fire('Error', 'Silakan pilih foto untuk data baru', 'error');
      return;
    }

    setIsLoading(true);
    const data = new FormData();
    data.append('nama', formData.nama);
    data.append('nomor_ujian', formData.nomor_ujian);
    data.append('fakultas', formData.fakultas); // Kirim fakultas

    if (formData.foto) {
      data.append('foto', formData.foto);
    }

    try {
      if (editId) {
        await axios.put(`http://localhost:5000/api/kartu/${editId}`, data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        Swal.fire('Sukses', 'Data berhasil diperbarui!', 'success');
      } else {
        await axios.post('http://localhost:5000/api/kartu', data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        Swal.fire('Sukses', 'Kartu Ujian berhasil dibuat!', 'success');
      }

      fetchKartu();
      cancelEdit();

    } catch (error) {
      console.error(error);
      Swal.fire('Gagal', 'Terjadi kesalahan sistem.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Hapus Data?',
      text: "Data tidak bisa dikembalikan!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Ya, hapus!'
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(`http://localhost:5000/api/kartu/${id}`);
        Swal.fire('Terhapus!', 'Data telah dihapus.', 'success');
        fetchKartu();
      } catch (error) {
        Swal.fire('Error', 'Gagal menghapus data.', 'error');
      }
    }
  }

  return (
    <div className="container">
      <header className="header">
        <h1>🎓 Sistem Kartu Ujian Mahasiswa</h1>
      </header>

      <div className="main-content">
        {/* FORM INPUT */}
        <div className="form-container">
          <h3>{editId ? '📝 Edit Data Mahasiswa' : '➕ Tambah Mahasiswa'}</h3>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Nama Lengkap</label>
              <input type="text" name="nama" value={formData.nama} onChange={handleChange} required />
            </div>

            <div className="form-group">
              <label>NIM / Nomor Ujian</label>
              <input type="text" name="nomor_ujian" value={formData.nomor_ujian} onChange={handleChange} required />
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
              <label>Pas Foto {editId && <small>(Biarkan kosong jika tidak ganti)</small>}</label>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                required={!editId}
              />
            </div>

            <div className="button-group">
              <button type="submit" disabled={isLoading} className="btn-submit">
                {isLoading ? 'Processing...' : (editId ? 'Update Data' : 'Simpan Data')}
              </button>

              {editId && (
                <button type="button" onClick={cancelEdit} className="btn-cancel">
                  Batal
                </button>
              )}
            </div>
          </form>
        </div>

        {/* LIST KARTU */}
        <div className="card-grid">
          {kartu.map((item) => (
            <div key={item.id} className="card">
              <div className="card-header">
                {/* Menampilkan Fakultas di badge */}
                <span className="badge-jurusan" style={{ fontSize: '0.7rem' }}>{item.fakultas}</span>
              </div>
              <div className="card-img-wrapper">
                <img src={item.foto_url} alt={item.nama} />
              </div>
              <div className="card-body">
                <h4>{item.nama}</h4>
                <p className="nomor-ujian">{item.nomor_ujian}</p>
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