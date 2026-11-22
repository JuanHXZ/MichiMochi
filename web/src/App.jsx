import { Suspense, lazy, useEffect } from 'react';
import { storageAdapter } from '@shared/services/storageAdapter';
import { useAuthStore } from '@modules/auth/application/stores/authStore';
import { useFavoriteStore } from '@modules/favorites/application/stores/favoriteStore';

const LoginPage = lazy(() => import('@modules/auth/presentation/pages/Login/LoginPage'));
const RegisterPage = lazy(() => import('@modules/auth/presentation/pages/Register/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('@modules/auth/presentation/pages/ForgotPassword/ForgotPasswordPage'));
const VerifyCodePage = lazy(() => import('@modules/auth/presentation/pages/VerifyCode/VerifyCodePage'));
const NewPasswordPage = lazy(() => import('@modules/auth/presentation/pages/NewPassword/NewPasswordPage'));
const DashboardPage = lazy(() => import('@modules/catalog/presentation/pages/Dashboard/DashboardPage'));
const AdminCatalogPage = lazy(() => import('@modules/catalog/presentation/pages/AdminCatalog/AdminCatalogPage'));
const ProductDetailPage = lazy(() => import('@modules/catalog/presentation/pages/ProductDetail/ProductDetailPage'));
const CartPage = lazy(() => import('@modules/cart/presentation/pages/Cart/CartPage'));
const CheckoutPage = lazy(() => import('@modules/orders/presentation/pages/Checkout/CheckoutPage'));
const OrdersPage = lazy(() => import('@modules/orders/presentation/pages/Orders/OrdersPage'));
const OrderTrackingPage = lazy(() => import('@modules/orders/presentation/pages/OrderTracking/OrderTrackingPage'));
const FavoritesPage = lazy(() => import('@modules/favorites/presentation/pages/Favorites/FavoritesPage'));
const RewardsPage = lazy(() => import('@modules/rewards/presentation/pages/Rewards/RewardsPage'));
const ComingSoonPage = lazy(() => import('@shared/pages/ComingSoon/ComingSoonPage'));

const currentPath = window.location.pathname.toLowerCase();
const isAuthenticated = storageAdapter.isAuthenticated();
const sessionUser = storageAdapter.getSessionUser();
const hasSessionUser = Boolean(sessionUser);
const isLoggedIn = isAuthenticated && hasSessionUser;
const isAdminRoute = currentPath === '/admin' || currentPath === '/admin/catalog';
const isProtectedCustomerRoute =
  currentPath === '/checkout' ||
  currentPath === '/orders' ||
  currentPath.startsWith('/orders/') ||
  currentPath === '/rewards';

let resolvedPath = currentPath;
if (isAdminRoute) {
  if (!isLoggedIn) {
    resolvedPath = '/login';
  } else if (sessionUser?.role !== 'admin') {
    resolvedPath = '/dashboard';
  }
} else if (isProtectedCustomerRoute && !isLoggedIn) {
  resolvedPath = '/login';
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
  '/checkout': { title: 'Checkout | Michi Mochi', component: <CheckoutPage /> },
  '/orders': { title: 'My Orders | Michi Mochi', component: <OrdersPage /> },
  '/favorites': { title: 'Favorites | Michi Mochi', component: <FavoritesPage /> },
  '/rewards': { title: 'Rewards | Michi Mochi', component: <RewardsPage /> },
  '/coming-soon': { title: 'Coming Soon | Michi Mochi', component: <ComingSoonPage /> },
};

let matchedRoute = routeMeta[resolvedPath];
if (!matchedRoute && resolvedPath.startsWith('/product/')) {
  matchedRoute = { title: 'Product Details | Michi Mochi', component: <ProductDetailPage /> };
}
if (!matchedRoute && resolvedPath.startsWith('/orders/')) {
  matchedRoute = { title: 'Order Tracking | Michi Mochi', component: <OrderTrackingPage /> };
}
matchedRoute = matchedRoute || rootRoute;
document.title = matchedRoute.title;

export default function App() {
  useEffect(() => {
    if (storageAdapter.isAuthenticated()) {
      useAuthStore.getState().hydrateSession();
    }
    useFavoriteStore.getState().loadFavorites();
  }, []);

  return (
    <Suspense fallback={<div className="route-loading" role="status">Loading...</div>}>
      {matchedRoute.component}
    </Suspense>
  );
}
