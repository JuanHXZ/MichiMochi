import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import './i18n';
import { storageAdapter } from '@/infrastructure/storage/storageAdapter';
import {
  LoginPage,
  RegisterPage,
  ForgotPasswordPage,
  DashboardPage,
  ProductDetailPage,
  CartPage,
  ComingSoonPage,
} from '@/presentation';

const currentPath = window.location.pathname.toLowerCase();
const isAuthenticated = storageAdapter.isAuthenticated();
const hasSessionUser = Boolean(storageAdapter.getSessionUser());

const protectedPath =
  (currentPath === '/dashboard' ||
    currentPath.startsWith('/product/') ||
    currentPath === '/cart' ||
    currentPath === '/coming-soon') &&
  (!isAuthenticated || !hasSessionUser);

const resolvedPath = protectedPath ? '/login' : currentPath;

if (protectedPath) {
  window.history.replaceState({}, '', '/login');
}

const pageByPath = {
  '/': <LoginPage />,
  '/login': <LoginPage />,
  '/forgot-password': <ForgotPasswordPage />,
  '/dashboard': <DashboardPage />,
  '/register': <RegisterPage />,
  '/cart': <CartPage />,
  '/coming-soon': <ComingSoonPage />,
};

let currentPage = pageByPath[resolvedPath];
if (!currentPage && resolvedPath.startsWith('/product/')) {
  currentPage = <ProductDetailPage />;
}
currentPage = currentPage || <LoginPage />;

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {currentPage}
  </StrictMode>
);
