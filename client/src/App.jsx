import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import './App.css';

function App() {
  const [kartu, setKartu] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editId, setEditId] = useState(null); // State untuk menyimpan ID yang sedang diedit
  const fileInputRef = useRef(null);

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

  // Fungsi untuk memasukkan data kartu ke dalam form (Mode Edit)
  const handleEdit = (item) => {
    setEditId(item.id);
    setFormData({
      nama: item.nama,
      nomor_ujian: item.nomor_ujian,
      jurusan: item.jurusan,
      foto: null // Foto di-reset karena kita tidak bisa set value input type file
    });
    
    // Scroll ke atas agar user melihat form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Fungsi membatalkan edit
  const cancelEdit = () => {
    setEditId(null);
    setFormData({ nama: '', nomor_ujian: '', jurusan: '', foto: null });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validasi: Foto wajib jika mode CREATE. Jika mode EDIT, foto opsional.
    if (!editId && !formData.foto) {
      Swal.fire('Error', 'Silakan pilih foto untuk data baru', 'error');
      return;
    }

    setIsLoading(true);
    const data = new FormData();
    data.append('nama', formData.nama);
    data.append('nomor_ujian', formData.nomor_ujian);
    data.append('jurusan', formData.jurusan);
    
    // Hanya append foto jika user memilih file baru
    if (formData.foto) {
      data.append('foto', formData.foto);
    }

    try {
      if (editId) {
        // --- LOGIKA UPDATE (PUT) ---
        await axios.put(`http://localhost:5000/api/kartu/${editId}`, data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        Swal.fire('Sukses', 'Data berhasil diperbarui!', 'success');
      } else {
        // --- LOGIKA CREATE (POST) ---
        await axios.post('http://localhost:5000/api/kartu', data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        Swal.fire('Sukses', 'Kartu Ujian berhasil dibuat!', 'success');
      }

      // Refresh & Reset
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
        <h1>🎓 Sistem Kartu Ujian</h1>
      </header>

      <div className="main-content">
        {/* FORM INPUT */}
        <div className="form-container">
          <h3>{editId ? '📝 Edit Data Peserta' : '➕ Tambah Peserta Baru'}</h3>
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Nama Lengkap</label>
              <input type="text" name="nama" value={formData.nama} onChange={handleChange} required />
            </div>
            
            <div className="form-group">
              <label>Nomor Ujian</label>
              <input type="text" name="nomor_ujian" value={formData.nomor_ujian} onChange={handleChange} required />
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
              <label>Pas Foto {editId && <small>(Biarkan kosong jika tidak ingin ganti foto)</small>}</label>
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
              <div className="card-header"><span className="badge-jurusan">{item.jurusan}</span></div>
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