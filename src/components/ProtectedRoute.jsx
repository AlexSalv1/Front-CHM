import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { verificarSessao } from '../api/authSessionApi';
import LoadingSpinner from './LoadingSpinner';

export default function ProtectedRoute({ children }) {
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('Verificando sessao...');

  useEffect(() => {
    let active = true;
    const warmupMessage = window.setTimeout(() => {
      if (active) {
        setMessage('Aguardando o servidor responder...');
      }
    }, 3500);

    verificarSessao()
      .then(() => {
        if (active) {
          window.clearTimeout(warmupMessage);
          setStatus('authenticated');
        }
      })
      .catch(() => {
        if (active) {
          window.clearTimeout(warmupMessage);
          setStatus('unauthenticated');
        }
      });

    return () => {
      active = false;
      window.clearTimeout(warmupMessage);
    };
  }, []);

  if (status === 'loading') {
    return <LoadingSpinner label={message} />;
  }

  if (status === 'unauthenticated') {
    return <Navigate to="/login" replace />;
  }

  return children;
}
