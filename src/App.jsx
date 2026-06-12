// Arquivo: frontend/src/App.jsx
import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Executivo from './pages/Executivo';
import Clientes from './pages/Clientes';
import Contratos from './pages/Contratos';
import Tarefas from './pages/Tarefas';
import Configuracoes from './pages/Configuracoes';
import Equipe from './pages/Equipe';
import Insumos from './pages/Insumos';
import Manutencao from './pages/Manutencao';
import Feedback from './pages/Feedback';
import FeedbackPublico from './pages/FeedbackPublico';
import Designs from './pages/Designs';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/feedback/:token" element={<FeedbackPublico />} />
      <Route path="/designs" element={<Designs />} />
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/executivo" element={<Executivo />} />
        <Route path="/clientes" element={<Clientes />} />
        <Route path="/contratos" element={<Contratos />} />
        <Route path="/tarefas" element={<Tarefas />} />
        <Route path="/equipe" element={<Equipe />} />
        <Route path="/funcionarios" element={<Navigate to="/equipe" replace />} />
        <Route path="/insumos" element={<Insumos />} />
        <Route path="/manutencao" element={<Manutencao />} />
        <Route path="/feedback" element={<Feedback />} />
        <Route path="/configuracoes" element={<Configuracoes />} />
      </Route>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
