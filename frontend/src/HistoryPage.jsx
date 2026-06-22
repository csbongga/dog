import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Trash2 } from 'lucide-react';
import ImageModal from './ImageModal';

const API_URL = 'http://localhost:8080';

export default function HistoryPage() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState(null);
  const [zoomImage, setZoomImage] = useState(null);

  const fetchHistory = async () => {
    try {
      const res = await axios.get(`${API_URL}/history`);
      setHistory(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await axios.delete(`${API_URL}/history/${deleteId}`);
      setDeleteId(null);
      fetchHistory();
    } catch (err) {
      console.error(err);
      alert("Failed to delete record.");
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', marginTop: '4rem' }}>Loading history...</div>;
  }

  return (
    <div className="glass animate-fade-in" style={{ padding: '2rem' }}>
      <h2 style={{ marginBottom: '2rem' }}>Analysis History</h2>
      
      {history.length === 0 ? (
        <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No history found.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                <th style={{ padding: '1rem' }}>Image</th>
                <th style={{ padding: '1rem' }}>Date</th>
                <th style={{ padding: '1rem' }}>Name / Patient ID</th>
                <th style={{ padding: '1rem' }}>File Name</th>
                <th style={{ padding: '1rem' }}>Heart Area (cm²)</th>
                <th style={{ padding: '1rem' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {history.map((item) => (
                <tr key={item.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ position: 'relative', cursor: 'zoom-in', width: 'fit-content' }} onClick={() => setZoomImage(`${API_URL}/${item.result_image_path}`)}>
                      <img src={`${API_URL}/${item.result_image_path}`} alt="Result" style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--border)' }} crossOrigin="anonymous" />
                    </div>
                  </td>
                  <td style={{ padding: '1rem' }}>{new Date(item.timestamp).toLocaleString()}</td>
                  <td style={{ padding: '1rem', fontWeight: '500' }}>{item.custom_name || '-'}</td>
                  <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{item.file_name}</td>
                  <td style={{ padding: '1rem', fontWeight: 'bold', color: 'var(--primary)', fontSize: '1.2rem' }}>{item.area_cm2}</td>
                  <td style={{ padding: '1rem' }}>                 <button 
                      className="btn-danger" 
                      onClick={() => setDeleteId(item.id)}
                      style={{ padding: '0.4rem 0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Image Zoom Modal */}
      <ImageModal imageUrl={zoomImage} onClose={() => setZoomImage(null)} />

      {/* Confirmation Modal */}
      {deleteId && (
        <div className="modal-overlay animate-fade-in">
          <div className="modal-content">
            <h3 style={{ marginTop: 0 }}>Confirm Delete</h3>
            <p style={{ color: 'var(--text-muted)' }}>Are you sure you want to delete this record? This action cannot be undone.</p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
              <button className="btn-secondary" onClick={() => setDeleteId(null)}>Cancel</button>
              <button className="btn-danger" onClick={handleDelete} style={{ color: 'white' }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
