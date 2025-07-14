const ErrorMessage = ({ isVisible, onRetry, loading }) => {
  if (!isVisible) return null

  return (
    <div style={{
      marginBottom: '32px',
      padding: '20px',
      border: '1px solid #fee',
      backgroundColor: '#fef2f2',
      textAlign: 'center',
      boxSizing: 'border-box',
      width: '100%'
    }}>
      <div style={{
        fontSize: '2rem',
        marginBottom: '12px'
      }}>
        ⚠️
      </div>
      <p style={{
        fontSize: '0.9rem',
        color: '#dc2626',
        marginBottom: '16px',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        fontWeight: '400'
      }}>
        Can't reach Wiktionary
      </p>
      <button 
        onClick={onRetry} 
        disabled={loading}
        style={{
          padding: '8px 24px',
          backgroundColor: '#dc2626',
          color: 'white',
          fontSize: '0.75rem',
          fontWeight: '500',
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          border: 'none',
          cursor: loading ? 'not-allowed' : 'pointer',
          transition: 'background-color 0.2s'
        }}
        onMouseOver={(e) => !loading && (e.target.style.backgroundColor = '#b91c1c')}
        onMouseOut={(e) => !loading && (e.target.style.backgroundColor = '#dc2626')}
      >
        {loading ? 'RETRYING...' : 'TRY AGAIN'}
      </button>
    </div>
  )
}

export default ErrorMessage