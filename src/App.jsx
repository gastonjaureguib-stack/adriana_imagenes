import { useState, useEffect } from 'react'
import { supabase } from './lib/supabaseClient'
import Login from './components/Login'
import Header from './components/Header'
import ModalCrearDestino from './components/ModalCrearDestino'
import VisorGaleria from './components/VisorGaleria'
import { PlusCircle, Search, FolderPlus, Trash2, Play, X, Download } from 'lucide-react'

// Librerías para empaquetar y descargar ZIP
import JSZip from 'jszip'
import { saveAs } from 'file-saver'

export default function App() {
  const [user, setUser] = useState(null)
  const [cargandoSesion, setCargandoSesion] = useState(true)
  const [destinos, setDestinos] = useState([])
  const [archivos, setArchivos] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [modalAbierto, setModalAbierto] = useState(false)
  const [destinoSeleccionado, setDestinoSeleccionado] = useState(null)

  // Estado para saber qué destino se está descargando (progreso)
  const [descargandoId, setDescargandoId] = useState(null)

  // Estado para el Visor en Pantalla Completa
  const [visorAbierto, setVisorAbierto] = useState(false)
  const [listaVisor, setListaVisor] = useState([])
  const [indiceVisor, setIndiceVisor] = useState(0)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setCargandoSesion(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setCargandoSesion(false)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (user) cargarDatos()
  }, [user])

  const cargarDatos = async () => {
    const { data: dataDestinos } = await supabase.from('destinos').select('*').order('created_at', { ascending: false })
    const { data: dataArchivos } = await supabase.from('archivos_destino').select('*')

    setDestinos(dataDestinos || [])
    setArchivos(dataArchivos || [])
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  const borrarDestino = async (id) => {
    if (confirm('¿Seguro que deseas eliminar este destino y todas sus fotos?')) {
      await supabase.from('destinos').delete().eq('id', id)
      cargarDatos()
    }
  }

  const borrarArchivo = async (e, archivo) => {
    e.stopPropagation()

    if (confirm('¿Eliminar esta foto/vídeo?')) {
      try {
        if (archivo.storage_path) {
          await supabase.storage.from('galeria_viajes').remove([archivo.storage_path])
        }
        await supabase.from('archivos_destino').delete().eq('id', archivo.id)
        setArchivos((prev) => prev.filter((a) => a.id !== archivo.id))
      } catch (err) {
        alert('Error eliminando el archivo: ' + err.message)
      }
    }
  }

  // DESCARGAR DESTINO COMPLETO EN ZIP (Organizado por carpetas/secciones)
  const descargarDestino = async (destino, fotosDelDestino) => {
    if (fotosDelDestino.length === 0) {
      return alert('Este destino no tiene fotos o vídeos para descargar.')
    }

    setDescargandoId(destino.id)
    const zip = new JSZip()
    const folderName = destino.titulo.replace(/[^a-zA-Z0-9_-]/g, '_')

    try {
      for (let i = 0; i < fotosDelDestino.length; i++) {
        const item = fotosDelDestino[i]
        
        // Descargamos la imagen/video como Blob
        const response = await fetch(item.url)
        const blob = await response.blob()

        // Obtenemos la extensión
        const extension = item.url.split('.').pop().split('?')[0] || (item.tipo === 'video' ? 'mp4' : 'jpg')
        
        // Si tiene sección, creamos subcarpeta dentro del ZIP
        const seccionLimpia = (item.seccion || 'General').replace(/[^a-zA-Z0-9_-]/g, '_')
        const fileName = `${seccionLimpia}/${folderName}_${i + 1}.${extension}`

        // Agregamos al ZIP
        zip.file(fileName, blob)
      }

      const content = await zip.generateAsync({ type: 'blob' })
      saveAs(content, `${folderName}.zip`)

    } catch (error) {
      alert('Error al descargar los archivos: ' + error.message)
    } finally {
      setDescargandoId(null)
    }
  }

  const abrirVisor = (fotosDelDestino, index) => {
    setListaVisor(fotosDelDestino)
    setIndiceVisor(index)
    setVisorAbierto(true)
  }

  if (cargandoSesion) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--primary-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>
        Cargando...
      </div>
    )
  }

  if (!user) return <Login onLogin={setUser} />

  const destinosFiltrados = destinos.filter((d) =>
    d.titulo.toLowerCase().includes(busqueda.toLowerCase())
  )

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--primary-blue)', color: 'white', display: 'flex', flexDirection: 'column' }}>
      <Header user={user} onLogout={handleLogout} />

      {/* HERO SECTION */}
      <section style={{ backgroundColor: '#1e293b', padding: '30px 20px', textAlign: 'center', borderBottom: '3px solid var(--accent-yellow)' }}>
        <h2 style={{ fontSize: '26px', marginBottom: '8px' }}>Galería Privada de Viajes</h2>
        <p style={{ color: '#94a3b8', marginBottom: '20px' }}>Gestión rápida de multimedia en alta definición</p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <button className="btn-primary" onClick={() => { setDestinoSeleccionado(null); setModalAbierto(true); }}>
            <PlusCircle size={20} /> Crear Nuevo Destino
          </button>

          <div style={{ position: 'relative', minWidth: '260px' }}>
            <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Buscar por destino..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              style={{ width: '100%', padding: '12px 12px 12px 40px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#0f172a', color: 'white', outline: 'none' }}
            />
          </div>
        </div>
      </section>

      {/* LISTA DE DESTINOS */}
      <main style={{ padding: '30px 20px', maxWidth: '1200px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
        {destinosFiltrados.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>
            <p>No hay destinos registrados. Haz clic en "Crear Nuevo Destino" para agregar fotos.</p>
          </div>
        ) : (
          destinosFiltrados.map((destino) => {
            const fotosDelDestino = archivos.filter((a) => a.destino_id === destino.id)
            const estaDescargando = descargandoId === destino.id

            // AGRUPACIÓN POR SECCIONES/SUBTÍTULOS
            const seccionesAgrupadas = fotosDelDestino.reduce((acc, foto) => {
              const nombreSec = foto.seccion || 'General'
              if (!acc[nombreSec]) acc[nombreSec] = []
              acc[nombreSec].push(foto)
              return acc
            }, {})

            return (
              <div key={destino.id} style={{ backgroundColor: '#1e293b', borderRadius: '12px', padding: '20px', marginBottom: '32px', border: '1px solid #334155' }}>
                {/* CABECERA DE DESTINO */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <h3 style={{ fontSize: '24px', color: 'white', margin: 0 }}>{destino.titulo}</h3>
                    <span style={{ fontSize: '13px', color: '#94a3b8' }}>{fotosDelDestino.length} archivo(s) en total</span>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => descargarDestino(destino, fotosDelDestino)}
                      disabled={estaDescargando}
                      style={{
                        backgroundColor: '#10b981',
                        color: 'white',
                        border: 'none',
                        padding: '8px 14px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '14px',
                        fontWeight: '600'
                      }}
                    >
                      <Download size={16} />
                      {estaDescargando ? 'Preparando ZIP...' : 'Descargar ZIP'}
                    </button>

                    <button className="btn-secondary" onClick={() => { setDestinoSeleccionado(destino); setModalAbierto(true); }}>
                      <FolderPlus size={16} /> Subir Nueva Sección
                    </button>
                    <button className="btn-danger" onClick={() => borrarDestino(destino.id)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* BLOQUES ORGANIZADOS POR SECCIÓN */}
                {Object.keys(seccionesAgrupadas).length === 0 ? (
                  <p style={{ fontSize: '14px', color: '#94a3b8' }}>Este destino aún no tiene fotos ni vídeos.</p>
                ) : (
                  Object.entries(seccionesAgrupadas).map(([nombreSeccion, fotos]) => (
                    <div key={nombreSeccion} style={{ marginBottom: '24px' }}>
                      {/* TITULO DE LA SECCIÓN */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', borderBottom: '1px dashed #334155', paddingBottom: '6px' }}>
                        <span style={{ color: 'var(--accent-yellow)', fontWeight: 'bold', fontSize: '15px' }}>📁 {nombreSeccion}</span>
                        <span style={{ fontSize: '12px', color: '#94a3b8' }}>({fotos.length})</span>
                      </div>

                      {/* GRILLA DE MINIATURAS */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '12px' }}>
                        {fotos.map((item) => (
                          <div
                            key={item.id}
                            onClick={() => abrirVisor(fotosDelDestino, fotosDelDestino.findIndex(f => f.id === item.id))}
                            style={{
                              position: 'relative',
                              height: '130px',
                              borderRadius: '8px',
                              overflow: 'hidden',
                              backgroundColor: '#0f172a',
                              cursor: 'pointer',
                              border: '1px solid #334155'
                            }}
                          >
                            <button
                              onClick={(e) => borrarArchivo(e, item)}
                              title="Eliminar este archivo"
                              style={{
                                position: 'absolute',
                                top: '6px',
                                right: '6px',
                                backgroundColor: 'rgba(239, 68, 68, 0.85)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '50%',
                                width: '24px',
                                height: '24px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                zIndex: 10
                              }}
                            >
                              <X size={14} />
                            </button>

                            {item.tipo === 'video' ? (
                              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#020617', color: 'white' }}>
                                <Play size={32} color="var(--accent-yellow)" />
                                <span style={{ position: 'absolute', bottom: '6px', left: '6px', fontSize: '10px', backgroundColor: 'rgba(0,0,0,0.7)', padding: '2px 6px', borderRadius: '4px' }}>VÍDEO</span>
                              </div>
                            ) : (
                              <img src={item.url} alt="Preview" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )
          })
        )}
      </main>

      <ModalCrearDestino
        isOpen={modalAbierto}
        onClose={() => setModalAbierto(false)}
        onDestinoCreado={cargarDatos}
        destinoEditar={destinoSeleccionado}
      />

      {visorAbierto && (
        <VisorGaleria
          archivos={listaVisor}
          indiceInicial={indiceVisor}
          onClose={() => setVisorAbierto(false)}
        />
      )}
    </div>
  )
}