
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { DataProvider, useData } from './context/DataContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { ToastContainer } from './components/Toast';
import { Login } from './pages/Login';
import { SplashScreen } from './components/SplashScreen';

// Pages
import { Dashboard } from './pages/Dashboard';
import { POS } from './pages/POS';
import { Inventory } from './pages/Inventory';
import { Sales } from './pages/Sales';
import { Clients } from './pages/Clients';
import { Settings } from './pages/Settings';
import { Suppliers } from './pages/Suppliers';
import { CashBox } from './pages/CashBox';

const Layout: React.FC<{ children: React.ReactNode; title: string }> = ({ children, title }) => (
  <div className="flex bg-gray-50 min-h-screen">
    <Sidebar />
    <div className="flex-1 ml-64">
      <Header title={title} />
      <main>{children}</main>
    </div>
  </div>
);

const AuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useData();
    const location = useLocation();

    if (!user || !user.isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return <>{children}</>;
};

const MainApp: React.FC = () => {
  const [loading, setLoading] = useState(true);

  if (loading) {
    return <SplashScreen onFinish={() => setLoading(false)} />;
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/" element={<AuthGuard><Layout title="Panel Principal"><Dashboard /></Layout></AuthGuard>} />
        <Route path="/pos" element={<AuthGuard><Layout title="Punto de Venta"><POS /></Layout></AuthGuard>} />
        <Route path="/inventory" element={<AuthGuard><Layout title="Inventario"><Inventory /></Layout></AuthGuard>} />
        <Route path="/sales" element={<AuthGuard><Layout title="Historial"><Sales /></Layout></AuthGuard>} />
        <Route path="/cashbox" element={<AuthGuard><Layout title="Caja Diaria"><CashBox /></Layout></AuthGuard>} />
        <Route path="/clients" element={<AuthGuard><Layout title="Clientes"><Clients /></Layout></AuthGuard>} />
        <Route path="/suppliers" element={<AuthGuard><Layout title="Proveedores"><Suppliers /></Layout></AuthGuard>} />
        <Route path="/settings" element={<AuthGuard><Layout title="Configuración"><Settings /></Layout></AuthGuard>} />
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <ToastContainer />
    </Router>
  );
};

const App: React.FC = () => {
  return (
    <DataProvider>
      <MainApp />
    </DataProvider>
  );
};

export default App;
