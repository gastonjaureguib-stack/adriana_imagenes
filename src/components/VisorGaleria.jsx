import { useState, useEffect } from 'react'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'

export default function VisorGaleria({ archivos, indiceInicial, onClose }) {
  const [actual, setActual] = useState(indiceInicial)

  // Manejo de teclas (flechas izquierda/derecha y Esc para cerrar)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') siguiente()
      if (e.key === 'ArrowLeft') anterior()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [actual])

  const siguiente = () => {
    setActual((prev) => (prev + 1) % archivos.length)
  }

  const anterior = () => {
    setActual((prev) => (prev - 1 + archivos.length) % archivos.length)
  }

  const item = archivos[actual]
  if (!item) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        zIndex: 2000,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
    >
      {/* Botón Cerrar */}
      <button
        onClick={onClose}
        style={{
          position: 'absolute',
          top: '20px', right: '20px',
          backgroundColor: 'rgba(255,255,255,0.1)',
          border: 'none',
          color: 'white',
          borderRadius: '50%',
          width: '44px',
          height: '44px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 2010
        }}
      >
        <X size={28} />
      </button>

      {/* Contador de Fotos */}
      <div
        style={{
          position: 'absolute',
          top: '28px',
          color: '#cbd5e1',
          fontSize: '15px',
          fontWeight: 'bold',
          backgroundColor: 'rgba(0,0,0,0.5)',
          padding: '6px 16px',
          borderRadius: '20px'
        }}
      >
        {actual + 1} / {archivos.length}
      </div>

      {/* Flechas de Navegación */}
      {archivos.length > 1 && (
        <>
          <button
            onClick={anterior}
            style={{
              position: 'absolute', left: '16px',
              backgroundColor: 'rgba(255,255,255,0.15)',
              border: 'none', color: 'white', borderRadius: '50%',
              width: '50px', height: '50px', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', zIndex: 2010
            }}
          >
            <ChevronLeft size={32} />
          </button>

          <button
            onClick={siguiente}
            style={{
              position: 'absolute', right: '16px',
              backgroundColor: 'rgba(255,255,255,0.15)',
              border: 'none', color: 'white', borderRadius: '50%',
              width: '50px', height: '50px', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', zIndex: 2010
            }}
          >
            <ChevronRight size={32} />
          </button>
        </>
      )}

      {/* Contenido Multimedia en Alta Definición */}
      <div style={{ maxWidth: '90vw', maxHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {item.tipo === 'video' ? (
          <video
            key={item.id}
            src={item.url}
            controls
            autoPlay
            style={{ maxWidth: '100%', maxHeight: '80vh', borderRadius: '8px' }}
          />
        ) : (
          <img
            key={item.id}
            src={item.url}
            alt="Visor grande"
            style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain', borderRadius: '8px' }}
          />
        )}
      </div>
    </div>
  )
}