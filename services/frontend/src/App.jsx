import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import NavBar from './components/NavBar.jsx';
import Home from './pages/Home.jsx';
import ProductDetail from './pages/ProductDetail.jsx';
import CartPage from './pages/CartPage.jsx';
import CheckoutPage from './pages/CheckoutPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import AdminPage from './pages/AdminPage.jsx';
import OrdersPage from './pages/OrdersPage.jsx';
import AiChat from './components/AiChat.jsx';
import { useAuthStore } from './store/index.js';

export default function App() {
  const token = useAuthStore((s) => s.token);

  return (
    <BrowserRouter>
      <NavBar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/products/:id" element={<ProductDetail />} />
        <Route path="/cart" element={token ? <CartPage /> : <Navigate to="/login" />} />
        <Route path="/checkout" element={token ? <CheckoutPage /> : <Navigate to="/login" />} />
        <Route path="/orders" element={token ? <OrdersPage /> : <Navigate to="/login" />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
      <AiChat />
    </BrowserRouter>
  );
}
