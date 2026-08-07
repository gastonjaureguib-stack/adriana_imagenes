import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { X, Upload } from 'lucide-react'

export default function ModalCrearDestino({ isOpen, onClose, onDestinoCreado, destinoEditar = null }) {
  const [titulo, setTitulo] = useState(destinoEditar ? destinoEditar.titulo : '')
  const [seccion, setSeccion] = useState('')
  const [archivos, setArchivos] = useState([])
  const [uploading, setUploading] = useState(false)
  const [progreso, setProgreso] = useState({ actual: 0, total: 0 })

  if (!isOpen) return null

  const handleSubirFotos = async (e) => {
    e.preventDefault()
    
    // Validación inicial cuando editamos o creamos
    if (!destinoEditar && !titulo.trim()) {
      return alert('Por favor ingresa un título para el destino')
    }
    if (archivos.length === 0) {
      return alert('Por favor selecciona al menos una foto o vídeo')
    }
    
    setUploading(true)
    setProgreso({ actual: 0, total: archivos.length })

    try {
      let destinoId = destinoEditar?.id

      // Si es un destino nuevo, lo creamos primero en la BD
      if (!destinoId) {
        const { data: nuevoDestino, error: errDestino } = await supabase
          .from('destinos')
          .insert([{ titulo: titulo.trim() }])
          .select()
          .single()

        if (errDestino) throw errDestino
        destinoId = nuevoDestino.id
      }

      const nombreSeccion = seccion.trim() || 'General'
      let completados = 0

      // PARALELIZACIÓN: Subimos todos los archivos simultáneamente
      const promesasSubida = archivos.map(async (file) => {
        const fileExt = file.name.split('.').pop().toLowerCase()
        const timestamp = Date.now()
        const randomId = Math.floor(Math.random() * 100000)
        const fileName = `${destinoId}/${timestamp}_${randomId}.${fileExt}`
        const esVideo = file.type.startsWith('video/')

        // Subida al Bucket de Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('galeria_viajes')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: true,
            contentType: file.type || (esVideo ? 'video/mp4' : 'image/jpeg')
          })

        if (uploadError) throw uploadError

        // Actualizamos contador visual de progreso
        completados++
        setProgreso({ actual: completados, total: archivos.length })

        // Obtenemos URL pública
        const { data: urlData } = supabase.storage
          .from('galeria_viajes')
          .getPublicUrl(fileName)

        // Retornamos el objeto para la inserción masiva en la base de datos
        return {
          destino_id: destinoId,
          url: urlData.publicUrl,
          tipo: esVideo ? 'video' : 'imagen',
          storage_path: fileName,
          seccion: nombreSeccion
        }
      })

      // Esperamos a que todas las subidas en paralelo finalicen
      const registrosParaBD = await Promise.all(promesasSubida)

      // Inserción en lote (Batch Insert) en la tabla 'archivos_destino'
      const { error: dbError } = await supabase
        .from('archivos_destino')
        .insert(registrosParaBD)

      if (dbError) throw dbError

      // Finalización limpia
      onDestinoCreado()
      onClose()
      setTitulo('')
      setSeccion('')
      setArchivos([])
    } catch (err) {
      alert('Error guardando los archivos: ' + err.message)
    } finally {
      setUploading(false)
      setProgreso({ actual: 0, total: 0 })
    }
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: '#1e293b',
        color: 'white',
        borderRadius: '16px',
        padding: '32px',
        width: '100%',
        maxWidth: '500px',
        position: 'relative',
        border: '1px solid #334155'
      }}>
        <button 
          onClick={onClose}
          disabled={uploading}
          style={{ position: 'absolute', top: '16px', right: '16px', border: 'none', background: 'none', cursor: 'pointer' }}
        >
          <X size={24} color="#94a3b8" />
        </button>

        <h3 style={{ color: 'white', marginBottom: '20px' }}>
          {destinoEditar ? `Agregar fotos a: ${destinoEditar.titulo}` : 'Crear Nuevo Destino'}
        </h3>

        <form onSubmit={handleSubirFotos} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {!destinoEditar && (
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '6px', color: '#cbd5e1' }}>
                Nombre del Destino (Ej: Cancún 2026)
              </label>
              <input
                type="text"
                placeholder="Nombre del viaje..."
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                required
                disabled={uploading}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#0f172a', color: 'white', boxSizing: 'border-box' }}
              />
            </div>
          )}

          {/* Campo para la Sección o Subtítulo */}
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '6px', color: 'var(--accent-yellow)' }}>
              Nombre del Bloque / Sección (Opcional)
            </label>
            <input
              type="text"
              placeholder="Ej: Parte 1, Excursión Volcán, Día 2..."
              value={seccion}
              onChange={(e) => setSeccion(e.target.value)}
              disabled={uploading}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#0f172a', color: 'white', boxSizing: 'border-box' }}
            />
            <span style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px', display: 'block' }}>
              Si lo dejas vacío se guardará como "General".
            </span>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '6px', color: '#cbd5e1' }}>
              Seleccionar Fotos y Vídeos
            </label>
            <input
              type="file"
              multiple
              accept="image/*,video/*"
              onChange={(e) => setArchivos([...e.target.files])}
              disabled={uploading}
              style={{ display: 'none' }}
              id="file-input"
            />
            <label 
              htmlFor="file-input"
              style={{
                border: '2px dashed var(--accent-yellow)',
                borderRadius: '8px',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: uploading ? 'not-allowed' : 'pointer',
                backgroundColor: '#0f172a',
                gap: '8px',
                opacity: uploading ? 0.6 : 1
              }}
            >
              <Upload size={32} color="var(--accent-yellow)" />
              <span style={{ fontSize: '14px', color: 'white', fontWeight: '600', textAlign: 'center' }}>
                Toca aquí para seleccionar los archivos
              </span>
            </label>

            {archivos.length > 0 && (
              <p style={{ fontSize: '13px', color: '#34d399', marginTop: '8px', fontWeight: 'bold' }}>
                ✓ {archivos.length} archivo(s) seleccionado(s)
              </p>
            )}
          </div>

          <button 
            type="submit" 
            className="btn-primary" 
            disabled={uploading} 
            style={{ 
              justifyContent: 'center', 
              marginTop: '12px',
              backgroundColor: uploading ? '#475569' : undefined,
              cursor: uploading ? 'wait' : 'pointer'
            }}
          >
            {uploading 
              ? `Subiendo archivos (${progreso.actual}/${progreso.total})...` 
              : 'Guardar Bloque de Fotos'}
          </button>
        </form>
      </div>
    </div>
  )
}