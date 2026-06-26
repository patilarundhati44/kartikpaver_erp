import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Purchases from './pages/Purchases';
import Production from './pages/Production';
import Sales from './pages/Sales';
import CreditLedger from './pages/CreditLedger';
import Inventory from './pages/Inventory';
import Expenses from './pages/Expenses';
import Reports from './pages/Reports';
import Analytics from './pages/Analytics';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public login route */}
          <Route path="/login" element={<Login />} />
          
          {/* Private ERP admin routes wrapped inside Layout */}
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="products" element={<Products />} />
            <Route path="purchases" element={<Purchases />} />
            <Route path="production" element={<Production />} />
            <Route path="sales" element={<Sales />} />
            <Route path="credit-ledger" element={<CreditLedger />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="expenses" element={<Expenses />} />
            <Route path="reports" element={<Reports />} />
            <Route path="analytics" element={<Analytics />} />
          </Route>

          {/* Catch-all redirect to index */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
