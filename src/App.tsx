import React from 'react';
import Dashboard from './components/Dashboard';
import { useSocket } from './contexts/SocketContext';

function App() {
  const { isConnected } = useSocket();

  return (
    <div className="min-h-screen bg-dark-900 text-white font-sans">
      {!isConnected && (
        <div className="fixed top-0 left-0 w-full bg-error-600 text-white p-2 text-center z-50">
          Server connection lost. Attempting to reconnect...
        </div>
      )}
      <Dashboard />
    </div>
  );
}

export default App;