import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { SocketProvider } from './contexts/SocketContext';
import { TransactionProvider } from './contexts/TransactionContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SocketProvider>
      <TransactionProvider>
        <App />
      </TransactionProvider>
    </SocketProvider>
  </StrictMode>
);