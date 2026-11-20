import { Suspense, lazy } from 'react';
import { storageAdapter } from '@shared/services/storageAdapter';

const LoginPage = lazy(() => import('@modules/auth/presentation/pages/Login/LoginPage'));
const RegisterPage = lazy(() => import('@modules/auth/presentation/pages/Register/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('@modules/auth/presentation/pages/ForgotPassword/ForgotPasswordPage'));
const VerifyCodePage = lazy(() => import('@modules/auth/presentation/pages/VerifyCode/VerifyCodePage'));
const NewPasswordPage = lazy(() => import('@modules/auth/presentation/pages/NewPassword/NewPasswordPage'));
const DashboardPage = lazy(() => import('@modules/catalog/presentation/pages/Dashboard/DashboardPage'));
const AdminCatalogPage = lazy(() => import('@modules/catalog/presentation/pages/AdminCatalog/AdminCatalogPage'));
const ProductDetailPage = lazy(() => import('@modules/catalog/presentation/pages/ProductDetail/ProductDetailPage'));
const CartPage = lazy(() => import('@modules/cart/presentation/pages/Cart/CartPage'));
const ComingSoonPage = lazy(() => import('@shared/pages/ComingSoon/ComingSoonPage'));

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

const routeMeta = {
  '/': { title: 'Sign In | Michi Mochi', component: <LoginPage /> },
  '/login': { title: 'Sign In | Michi Mochi', component: <LoginPage /> },
  '/forgot-password': { title: 'Forgot Password | Michi Mochi', component: <ForgotPasswordPage /> },
  '/verify-code': { title: 'Verify Code | Michi Mochi', component: <VerifyCodePage /> },
  '/verify-otp': { title: 'Verify Code | Michi Mochi', component: <VerifyCodePage /> },
  '/new-password': { title: 'Reset Password | Michi Mochi', component: <NewPasswordPage /> },
  '/reset-password': { title: 'Reset Password | Michi Mochi', component: <NewPasswordPage /> },
  '/dashboard': { title: 'Catalog | Michi Mochi', component: <DashboardPage /> },
  '/admin': { title: 'Admin Catalog | Michi Mochi', component: <AdminCatalogPage /> },
  '/admin/catalog': { title: 'Admin Catalog | Michi Mochi', component: <AdminCatalogPage /> },
  '/register': { title: 'Create Account | Michi Mochi', component: <RegisterPage /> },
  '/cart': { title: 'Shopping Cart | Michi Mochi', component: <CartPage /> },
  '/coming-soon': { title: 'Coming Soon | Michi Mochi', component: <ComingSoonPage /> },
};

let matchedRoute = routeMeta[resolvedPath];
if (!matchedRoute && resolvedPath.startsWith('/product/')) {
  matchedRoute = { title: 'Product Details | Michi Mochi', component: <ProductDetailPage /> };
}
matchedRoute = matchedRoute || routeMeta['/login'];
document.title = matchedRoute.title;

export default function App() {
  return (
    <Suspense fallback={<div className="route-loading" role="status">Loading...</div>}>
      {matchedRoute.component}
    </Suspense>
  );
}
