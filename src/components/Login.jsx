import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { Lock, Eye, EyeOff } from 'lucide-react'

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [mostrarPassword, setMostrarPassword] = useState(false)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const cleanUsername = username.trim().toLowerCase()
    const fakeEmail = `${cleanUsername}@app.com`

    const { data, error } = await supabase.auth.signInWithPassword({
      email: fakeEmail,
      password,
    })

    if (error) {
      setError('Usuario o contraseña incorrectos.')
    } else {
      onLogin(data.user)
    }
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'var(--primary-blue)',
      padding: '20px',
      boxSizing: 'border-box'
    }}>
      <div style={{ textAlign: 'center', marginBottom: '28px' }}>
        <img 
          src="/logo.png" 
          alt="Logo Adriana Viajes" 
          style={{ 
            width: '240px', 
            height: '240px', 
            objectFit: 'contain',
            margin: '0 auto 16px auto',
            display: 'block',
            filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.3))'
          }} 
        />
        <h1 style={{ color: 'white', fontSize: '32px', fontWeight: 'bold', letterSpacing: '1px' }}>
          ADRIANA VIAJES
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '15px', marginTop: '6px' }}>
          Banco Privado de Fotos & Vídeos
        </p>
      </div>

      <div style={{
        backgroundColor: 'var(--card-bg)',
        padding: '32px',
        borderRadius: '20px',
        width: '100%',
        maxWidth: '380px',
        boxShadow: '0 20px 30px rgba(0, 0, 0, 0.4)',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '20px' }}>
          <Lock size={18} color="var(--accent-yellow)" />
          <span style={{ color: 'white', fontWeight: 'bold', fontSize: '13px', letterSpacing: '1px', textTransform: 'uppercase' }}>
            Acceso Autorizado
          </span>
        </div>

        {error && (
          <div style={{
            backgroundColor: 'rgba(239, 68, 68, 0.2)',
            border: '1px solid #ef4444',
            color: '#fca5a5',
            padding: '10px',
            borderRadius: '8px',
            marginBottom: '16px',
            fontSize: '13px',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#94a3b8', marginBottom: '6px' }}>
              USUARIO
            </label>
            <input
              type="text"
              placeholder="Ingresa tu usuario"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #334155',
                backgroundColor: '#0f172a',
                color: 'white',
                outline: 'none',
                fontSize: '15px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#94a3b8', marginBottom: '6px' }}>
              CONTRASEÑA
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={mostrarPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '12px 42px 12px 12px',
                  borderRadius: '8px',
                  border: '1px solid #334155',
                  backgroundColor: '#0f172a',
                  color: 'white',
                  outline: 'none',
                  fontSize: '15px',
                  boxSizing: 'border-box'
                }}
              />

              <button
                type="button"
                onClick={() => setMostrarPassword(!mostrarPassword)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '4px'
                }}
              >
                {mostrarPassword ? (
                  <EyeOff size={18} color="var(--accent-yellow)" />
                ) : (
                  <Eye size={18} color="#94a3b8" />
                )}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            className="btn-primary" 
            disabled={loading} 
            style={{
              justifyContent: 'center',
              marginTop: '10px',
              padding: '14px',
              fontSize: '16px',
              width: '100%'
            }}
          >
            {loading ? 'Ingresando...' : 'Entrar a la Galería'}
          </button>
        </form>
      </div>
    </div>
  )
}