// Arquivo: frontend/src/components/ProtectedRoute.jsx
import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { verificarSessao } from '../api/authSessionApi';
import LoadingSpinner from './LoadingSpinner';

export default function ProtectedRoute({ children }) {
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => {
      controller.abort();
      if (active) setStatus('unauthenticated');
    }, 3500);

    verificarSessao({ signal: controller.signal })
      .then(() => {
        if (active) {
          window.clearTimeout(timeout);
          setStatus('authenticated');
        }
      })
      .catch(() => {
        if (active) {
          window.clearTimeout(timeout);
          setStatus('unauthenticated');
        }
      });

    return () => {
      active = false;
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, []);

  if (status === 'loading') {
    return <LoadingSpinner label="Verificando sessão..." />;
  }

  if (status === 'unauthenticated') {
    return <Navigate to="/login" replace />;
  }

  return children;
}
