import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import './i18n';
import { storageAdapter } from '@shared/services/storageAdapter';
import {
  LoginPage,
  RegisterPage,
  ForgotPasswordPage,
  VerifyCodePage,
  NewPasswordPage,
  DashboardPage,
  AdminCatalogPage,
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
    currentPath === '/admin' ||
    currentPath === '/admin/catalog' ||
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
  '/verify-code': <VerifyCodePage />,
  '/verify-otp': <VerifyCodePage />,
  '/new-password': <NewPasswordPage />,
  '/reset-password': <NewPasswordPage />,
  '/dashboard': <DashboardPage />,
  '/admin': <AdminCatalogPage />,
  '/admin/catalog': <AdminCatalogPage />,
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
