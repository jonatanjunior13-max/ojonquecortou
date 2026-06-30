import React from 'react';

class AdminErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error('[AdminErrorBoundary] Erro capturado:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '40px 32px',
          background: 'var(--panel-bg, #1a1a1a)',
          borderRadius: 8,
          border: '1px solid rgba(220, 163, 84, 0.3)',
          margin: 24,
          fontFamily: 'system-ui, sans-serif'
        }}>
          <h2 style={{ color: '#DCA354', margin: '0 0 12px', fontSize: '1.1rem' }}>
            ⚠️ Erro ao carregar a página
          </h2>
          <p style={{ color: '#ccc', margin: '0 0 16px', fontSize: '0.9rem', lineHeight: 1.5 }}>
            Ocorreu um erro inesperado nesta seção. Veja o detalhe abaixo e reporte ao Jon.
          </p>
          <pre style={{
            background: '#111',
            color: '#ff6b6b',
            padding: '12px 16px',
            borderRadius: 4,
            fontSize: '0.78rem',
            overflowX: 'auto',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            marginBottom: 16
          }}>
            {this.state.error?.toString()}
            {'\n\n'}
            {this.state.errorInfo?.componentStack}
          </pre>
          <button
            onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
            style={{
              background: '#DCA354',
              color: '#0A0A0A',
              border: 'none',
              borderRadius: 999,
              padding: '10px 20px',
              fontWeight: 600,
              fontSize: '0.82rem',
              cursor: 'pointer',
              letterSpacing: '0.04em',
              textTransform: 'uppercase'
            }}
          >
            Tentar novamente
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default AdminErrorBoundary;
