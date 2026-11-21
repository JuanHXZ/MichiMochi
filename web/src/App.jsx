import { Suspense, lazy, useEffect } from 'react';
import { storageAdapter } from '@shared/services/storageAdapter';
import { useAuthStore } from '@modules/auth/application/stores/authStore';

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
const sessionUser = storageAdapter.getSessionUser();
const hasSessionUser = Boolean(sessionUser);
const isLoggedIn = isAuthenticated && hasSessionUser;
const isAdminRoute = currentPath === '/admin' || currentPath === '/admin/catalog';

let resolvedPath = currentPath;
if (isAdminRoute) {
  if (!isLoggedIn) {
    resolvedPath = '/login';
  } else if (sessionUser?.role !== 'admin') {
    resolvedPath = '/dashboard';
  }
}

if (resolvedPath !== currentPath) {
  window.history.replaceState({}, '', resolvedPath);
}

const rootRoute = isLoggedIn
  ? { title: 'Catalog | Michi Mochi', component: <DashboardPage /> }
  : { title: 'Sign In | Michi Mochi', component: <LoginPage /> };

const routeMeta = {
  '/': rootRoute,
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
matchedRoute = matchedRoute || rootRoute;
document.title = matchedRoute.title;

export default function App() {
  useEffect(() => {
    if (storageAdapter.isAuthenticated()) {
      useAuthStore.getState().hydrateSession();
    }
  }, []);

  return (
    <Suspense fallback={<div className="route-loading" role="status">Loading...</div>}>
      {matchedRoute.component}
    </Suspense>
  );
}
