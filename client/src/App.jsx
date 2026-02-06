import { useState, useEffect } from 'react';
import axios from 'axios';

function App() {
  const [kartu, setKartu] = useState([]);
  const [formData, setFormData] = useState({
    nama: '',
    nomor_ujian: '',
    jurusan: '',
    foto: null
  });

  // Fetch Data saat pertama kali load
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
    const data = new FormData();
    data.append('nama', formData.nama);
    data.append('nomor_ujian', formData.nomor_ujian);
    data.append('jurusan', formData.jurusan);
    data.append('foto', formData.foto);

    try {
      await axios.post('http://localhost:5000/api/kartu', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert('Kartu Ujian Berhasil Dibuat!');
      fetchKartu(); // Refresh list
    } catch (error) {
      console.error(error);
      alert('Gagal upload');
    }
  };

  const handleDelete = async (id) => {
    if(!confirm("Yakin hapus?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/kartu/${id}`);
      fetchKartu();
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>Sistem Kartu Ujian (Supabase + Cloudinary)</h1>
      
      {/* Form Input */}
      <form onSubmit={handleSubmit} style={{ marginBottom: '30px', border: '1px solid #ccc', padding: '10px' }}>
        <h3>Buat Kartu Baru</h3>
        <input type="text" name="nama" placeholder="Nama Siswa" onChange={handleChange} required /><br/><br/>
        <input type="text" name="nomor_ujian" placeholder="Nomor Ujian" onChange={handleChange} required /><br/><br/>
        <input type="text" name="jurusan" placeholder="Jurusan" onChange={handleChange} required /><br/><br/>
        <input type="file" onChange={handleFileChange} required /><br/><br/>
        <button type="submit">Simpan Kartu</button>
      </form>

      {/* List Kartu */}
      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        {kartu.map((item) => (
          <div key={item.id} style={{ border: '1px solid #000', padding: '10px', width: '200px', borderRadius: '8px' }}>
            <img src={item.foto_url} alt={item.nama} style={{ width: '100%', height: '150px', objectFit: 'cover' }} />
            <h4>{item.nama}</h4>
            <p>No: {item.nomor_ujian}</p>
            <p>Jurusan: {item.jurusan}</p>
            <button onClick={() => handleDelete(item.id)} style={{backgroundColor: 'red', color: 'white'}}>Hapus</button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;