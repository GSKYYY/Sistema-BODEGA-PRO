import React, { useState } from 'react';
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

const Layout: React.FC<{ children: React.ReactNode; title: string }> = ({ children, title }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 md:hidden animate-in fade-in"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar Container */}
      <div className={`fixed inset-y-0 left-0 z-30 w-64 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <Sidebar onClose={() => setIsSidebarOpen(false)} />
      </div>

      {/* Main Content */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        <Header title={title} onMenuClick={() => setIsSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto overflow-x-hidden relative">
            {children}
        </main>
      </div>
    </div>
  );
};

const AuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, loading } = useData();
    const location = useLocation();

    if (loading) {
        return <div className="h-screen flex items-center justify-center bg-gray-50 text-gray-400">Cargando sesión...</div>;
    }

    if (!user || !user.isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return <>{children}</>;
};

const MainApp: React.FC = () => {
  const [showSplash, setShowSplash] = useState(true);

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
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