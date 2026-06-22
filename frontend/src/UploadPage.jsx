import React, { useState, useRef } from 'react';
import axios from 'axios';
import { Upload, Loader, Download } from 'lucide-react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';

const API_URL = '/api';

export default function UploadPage() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [brightness, setBrightness] = useState(1.0);
  const [contrast, setContrast] = useState(1.0);
  const [customName, setCustomName] = useState('');
  const [zoomImage, setZoomImage] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileChange = async (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setResult(null);
      await generatePreview(selectedFile);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const selectedFile = e.dataTransfer.files[0];
      setFile(selectedFile);
      setResult(null);
      await generatePreview(selectedFile);
    }
  };

  const generatePreview = async (selectedFile) => {
    const formData = new FormData();
    formData.append('file', selectedFile);
    try {
      const res = await axios.post(`${API_URL}/preview`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setPreviewUrl(`${API_URL}/${res.data.preview_url}?t=${Date.now()}`);
    } catch (err) {
      console.error("Failed to generate preview", err);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('brightness', brightness);
    formData.append('contrast', contrast);
    formData.append('custom_name', customName);

    try {
      const res = await axios.post(`${API_URL}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setResult(res.data);
    } catch (err) {
      alert("Failed to upload and process file.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
        const html2pdf = (await import('html2pdf.js')).default;
        const element = document.getElementById('report-content');
        const opt = {
          margin: 0.5,
          filename: `Heart_Report_${result.file_name}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
        };
        html2pdf().from(element).set(opt).save();
    } catch (e) {
        console.error(e);
        alert("Could not generate PDF");
    }
  };

  return (
    <div className="animate-fade-in">
      {!result ? (
        <div className="glass" style={{ padding: '3rem' }}>
          <h1 style={{ textAlign: 'center', marginBottom: '2rem' }}>DICOM Heart Segmentation</h1>
          
          {!file ? (
            <div 
              className="drag-area"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                style={{ display: 'none' }} 
                onChange={handleFileChange} 
              />
              <Upload size={48} color="var(--primary)" style={{ marginBottom: '1rem' }} />
              <h3>Drag & Drop your DICOM file here</h3>
              <p style={{ color: 'var(--text-muted)' }}>or click to browse from your computer</p>
            </div>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <h3 style={{ marginBottom: '1rem' }}>File: {file.name}</h3>
              {previewUrl && (
                <div style={{ margin: '0 auto 2rem auto', width: '400px', height: '400px', position: 'relative', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden', cursor: 'grab' }}>
                  <TransformWrapper initialScale={1} minScale={0.5} maxScale={5} wheel={{ step: 0.01 }}>
                    <TransformComponent wrapperStyle={{ width: '100%', height: '100%' }}>
                      <img 
                        src={previewUrl} 
                        alt="Preview" 
                        style={{ 
                          width: '100%', 
                          height: '100%',
                          objectFit: 'contain',
                          filter: `brightness(${brightness}) contrast(${contrast})`,
                          transition: 'filter 0.2s ease'
                        }} 
                      />
                    </TransformComponent>
                  </TransformWrapper>
                  <div style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(0,0,0,0.5)', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', pointerEvents: 'none' }}>🖱️ Scroll to zoom / Drag to pan</div>
                </div>
              )}
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', maxWidth: '600px', margin: '0 auto 2rem auto', textAlign: 'left' }}>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    Brightness: {brightness.toFixed(1)}x
                  </label>
                  <input 
                    type="range" 
                    min="0.1" max="3.0" step="0.1" 
                    value={brightness} 
                    onChange={(e) => setBrightness(parseFloat(e.target.value))} 
                    style={{ width: '100%', cursor: 'pointer' }}
                  />
                </div>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    Contrast: {contrast.toFixed(1)}x
                  </label>
                  <input 
                    type="range" 
                    min="0.1" max="3.0" step="0.1" 
                    value={contrast} 
                    onChange={(e) => setContrast(parseFloat(e.target.value))} 
                    style={{ width: '100%', cursor: 'pointer' }}
                  />
                </div>
              </div>
              
              <div style={{ margin: '0 auto 2rem auto', maxWidth: '600px', textAlign: 'left' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Name / Patient ID (Optional)</label>
                <input 
                  type="text" 
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="e.g. John Doe or PID-12345"
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'rgba(255,255,255,0.05)', color: 'var(--text)' }}
                />
              </div>
              
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                <button 
                  className="btn-secondary" 
                  onClick={() => {setFile(null); setPreviewUrl(null); setBrightness(1.0); setContrast(1.0); setCustomName('');}} 
                  disabled={loading}
                >
                  Cancel
                </button>
                <button 
                  className="btn-primary" 
                  onClick={handleUpload} 
                  disabled={loading}
                  style={{ width: '200px', justifyContent: 'center' }}
                >
                  {loading ? <><span>⏳</span> Processing...</> : 'Analyze Image'}
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="glass animate-fade-in" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <h2>Analysis Result</h2>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button className="btn-secondary" onClick={() => {setResult(null); setFile(null); setPreviewUrl(null); setBrightness(1.0); setContrast(1.0); setCustomName('');}}>New Analysis</button>
              <button className="btn-primary" onClick={handleDownloadPDF}><Download size={18} /> Export PDF</button>
            </div>
          </div>
          
          <div id="report-content" style={{ padding: '1rem', background: 'var(--bg)', borderRadius: '8px' }}>
            <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
              <h3 style={{ margin: 0 }}>Heart Segmentation Report</h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>File: {result.file_name} | Date: {new Date(result.timestamp).toLocaleString()}</p>
              {result.custom_name && <p style={{ fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--primary)', margin: 0 }}>Name: {result.custom_name}</p>}
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
              <div style={{ textAlign: 'center' }}>
                <h4 style={{ marginBottom: '1rem' }}>Original Image</h4>
                <div style={{ position: 'relative', width: '100%', aspectRatio: '1/1', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden', cursor: 'grab' }}>
                  <TransformWrapper initialScale={1} minScale={0.5} maxScale={5} wheel={{ step: 0.01 }}>
                    <TransformComponent wrapperStyle={{ width: '100%', height: '100%' }}>
                      <img src={`${API_URL}/${result.original_image_path}`} alt="Original" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    </TransformComponent>
                  </TransformWrapper>
                  <div style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(0,0,0,0.5)', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', pointerEvents: 'none' }}>🖱️ Scroll to zoom</div>
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <h4 style={{ marginBottom: '1rem' }}>Segmented Image</h4>
                <div style={{ position: 'relative', width: '100%', aspectRatio: '1/1', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden', cursor: 'grab' }}>
                  <TransformWrapper initialScale={1} minScale={0.5} maxScale={5} wheel={{ step: 0.01 }}>
                    <TransformComponent wrapperStyle={{ width: '100%', height: '100%' }}>
                      <img src={`${API_URL}/${result.result_image_path}`} alt="Result" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    </TransformComponent>
                  </TransformWrapper>
                  <div style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(0,0,0,0.5)', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', pointerEvents: 'none' }}>🖱️ Scroll to zoom</div>
                </div>
              </div>
            </div>
            
            <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.2)', textAlign: 'center' }}>
              <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-muted)' }}>Calculated Heart Area</h3>
              <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                {result.area_cm2} <span style={{ fontSize: '1.2rem', fontWeight: 'normal' }}>cm²</span>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
