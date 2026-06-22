import React from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { X, ZoomIn, ZoomOut, Maximize } from 'lucide-react';

export default function ImageModal({ imageUrl, onClose }) {
  if (!imageUrl) return null;

  return (
    <div className="modal-overlay animate-fade-in" onClick={onClose} style={{ cursor: 'zoom-out', zIndex: 1000, display: 'flex', flexDirection: 'column' }}>
      <div 
        className="modal-content" 
        style={{ 
          width: '95vw', 
          height: '95vh', 
          maxWidth: 'none',
          padding: '1rem', 
          background: 'rgba(15, 23, 42, 0.95)', 
          border: '1px solid var(--border)', 
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'default'
        }} 
        onClick={(e) => e.stopPropagation()}
        onWheel={(e) => e.stopPropagation()}
      >
        <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
            <button className="btn-secondary" onClick={onClose} style={{ padding: '0.5rem', background: 'rgba(255,255,255,0.1)', border: 'none' }}>
              <X size={24} color="white" />
            </button>
        </div>

        <div style={{ flex: 1, width: '100%', height: '100%', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
          <TransformWrapper
            initialScale={1}
            minScale={0.5}
            maxScale={5}
            centerOnInit={true}
            wheel={{ step: 0.01 }}
          >
            {({ zoomIn, zoomOut, resetTransform }) => (
              <>
                <div style={{ position: 'absolute', bottom: '1rem', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '1rem', zIndex: 10, background: 'rgba(0,0,0,0.6)', padding: '0.5rem 1rem', borderRadius: '30px' }}>
                  <button className="btn-secondary" onClick={() => zoomOut()} style={{ padding: '0.5rem', border: 'none', background: 'transparent', color: 'white' }}><ZoomOut size={24} /></button>
                  <button className="btn-secondary" onClick={() => resetTransform()} style={{ padding: '0.5rem', border: 'none', background: 'transparent', color: 'white' }}><Maximize size={24} /></button>
                  <button className="btn-secondary" onClick={() => zoomIn()} style={{ padding: '0.5rem', border: 'none', background: 'transparent', color: 'white' }}><ZoomIn size={24} /></button>
                </div>
                <TransformComponent wrapperStyle={{ width: '100%', height: '100%' }}>
                  <img 
                    src={imageUrl} 
                    alt="Zoomed View" 
                    crossOrigin="anonymous" 
                    style={{ 
                      maxHeight: '80vh', 
                      maxWidth: '100%', 
                      objectFit: 'contain',
                      borderRadius: '8px'
                    }} 
                  />
                </TransformComponent>
              </>
            )}
          </TransformWrapper>
        </div>
      </div>
    </div>
  );
}
