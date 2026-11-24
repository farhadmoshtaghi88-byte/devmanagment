import React, { useState } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Tasks from './components/Tasks';
import Infrastructure from './components/Infrastructure';
import Clients from './components/Clients';
import Projects from './components/Projects';
import Finance from './components/Finance';
import BIReport from './components/BIReport';
import Products from './components/Products';
import Invoices from './components/Invoices';
import Settings from './components/Settings';
import Login from './components/Login';
import { DataProvider, useData } from './context/DataContext';

interface AppContentProps {
  onLogout: () => void;
}

const AppContent: React.FC<AppContentProps> = ({ onLogout }) => {
  const { activeTab } = useData();

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'clients':
        return <Clients />;
      case 'projects':
        return <Projects />;
      case 'products':
        return <Products />;
      case 'finance':
        return <Finance />;
      case 'invoices':
        return <Invoices />;
      case 'bi-report':
        return <BIReport />;
      case 'infrastructure':
      case 'domains':
        return <Infrastructure />;
      case 'tasks':
        return <Tasks />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return <Layout onLogout={onLogout}>{renderContent()}</Layout>;
};

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const local = localStorage.getItem('shaygan_auth_logged_in');
    const session = sessionStorage.getItem('shaygan_auth_logged_in');
    return local === 'true' || session === 'true' || local === null;
  });

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <DataProvider>
      <AppContent onLogout={handleLogout} />
    </DataProvider>
  );
};

export default App;
