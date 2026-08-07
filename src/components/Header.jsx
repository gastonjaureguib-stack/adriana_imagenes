import { LogOut } from 'lucide-react'

export default function Header({ user, onLogout }) {
  const nombreUsuario = user?.email?.split('@')[0] || 'Usuario'

  return (
    <header style={{
      backgroundColor: '#0f172a',
      color: 'white',
      padding: '16px 32px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottom: '1px solid #1e293b',
      boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <img 
          src="/logo.png" 
          alt="Logo Adriana Viajes" 
          style={{ width: '36px', height: '36px', objectFit: 'contain' }} 
        />
        <h1 style={{ fontSize: '18px', fontWeight: 'bold' }}>Adriana Viajes</h1>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <span style={{ fontSize: '14px', color: '#cbd5e1', textTransform: 'capitalize' }}>
          Hola, <strong style={{ color: 'var(--accent-yellow)' }}>{nombreUsuario}</strong>
        </span>
        <button 
          onClick={onLogout} 
          style={{
            background: 'none',
            border: 'none',
            color: '#ef4444',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '14px',
            fontWeight: '600'
          }}
        >
          <LogOut size={18} /> Salir
        </button>
      </div>
    </header>
  )
}