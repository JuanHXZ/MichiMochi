import { create } from 'zustand';
import { storageAdapter } from '@shared/services/storageAdapter';
import { favoriteService } from '../../infrastructure/services/favoriteService';

const GUEST_FAVORITES_KEY = 'michi-mochi-favorites';

const readGuestFavoriteIds = () => {
  const stored = storageAdapter.get(GUEST_FAVORITES_KEY, []);
  return Array.isArray(stored) ? stored.map(String) : [];
};

const writeGuestFavoriteIds = (ids) => {
  storageAdapter.set(GUEST_FAVORITES_KEY, ids);
};

export const useFavoriteStore = create((set, get) => ({
  favoriteIds: readGuestFavoriteIds(),
  favoriteProducts: [],
  isLoading: false,
  hasLoaded: false,

  isFavorite: (productId) => get().favoriteIds.includes(String(productId)),

  loadFavorites: async () => {
    const isAuth = storageAdapter.isAuthenticated() && Boolean(storageAdapter.getAuthToken());
    if (!isAuth) {
      set({ favoriteIds: readGuestFavoriteIds(), hasLoaded: true });
      return;
    }

    set({ isLoading: true });
    try {
      const guestIds = readGuestFavoriteIds();
      let data = await favoriteService.getFavorites();

      // Sincronizar favoritos guardados como visitante al iniciar sesión
      const missingGuest = guestIds.filter((id) => !(data.productIds || []).includes(id));
      if (missingGuest.length > 0) {
        for (const id of missingGuest) {
          try {
            data = await favoriteService.addFavorite(id);
          } catch {
            // Ignorar si un producto ya no existe
          }
        }
        storageAdapter.remove(GUEST_FAVORITES_KEY);
      }

      set({
        favoriteIds: (data.productIds || []).map(String),
        favoriteProducts: data.products || [],
        isLoading: false,
        hasLoaded: true,
      });
    } catch {
      set({ isLoading: false, hasLoaded: true });
    }
  },

  toggleFavorite: async (productOrId) => {
    const productId = String(typeof productOrId === 'object' ? productOrId.id : productOrId);
    const productObj = typeof productOrId === 'object' ? productOrId : null;
    const prevIds = get().favoriteIds;
    const prevProducts = get().favoriteProducts;
    const exists = prevIds.includes(productId);

    const optimisticIds = exists
      ? prevIds.filter((id) => id !== productId)
      : [productId, ...prevIds];
    const optimisticProducts = exists
      ? prevProducts.filter((p) => String(p.id) !== productId)
      : productObj
      ? [productObj, ...prevProducts]
      : prevProducts;

    set({ favoriteIds: optimisticIds, favoriteProducts: optimisticProducts });

    const isAuth = storageAdapter.isAuthenticated() && Boolean(storageAdapter.getAuthToken());
    if (!isAuth) {
      writeGuestFavoriteIds(optimisticIds);
      return !exists;
    }

    try {
      const data = exists
        ? await favoriteService.removeFavorite(productId)
        : await favoriteService.addFavorite(productId);
      set({
        favoriteIds: (data.productIds || []).map(String),
        favoriteProducts: data.products || [],
      });
      return !exists;
    } catch (err) {
      set({ favoriteIds: prevIds, favoriteProducts: prevProducts });
      throw err;
    }
  },
}));
