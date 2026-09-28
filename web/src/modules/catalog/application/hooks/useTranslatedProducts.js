import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useProductStore } from '../stores/productStore';
import { translateProduct, translateProducts } from '@/shared/utils/translateProduct';

export const useTranslatedProducts = () => {
  const { i18n } = useTranslation();
  const products = useProductStore((state) => state.products);
  const filteredProducts = useProductStore((state) => state.filteredProducts);

  const translatedProducts = useMemo(() => {
    return translateProducts(products);
  }, [products, i18n.language]);

  const translatedFilteredProducts = useMemo(() => {
    return translateProducts(filteredProducts);
  }, [filteredProducts, i18n.language]);

  return {
    products: translatedProducts,
    filteredProducts: translatedFilteredProducts,
  };
};

export const useTranslatedProduct = (productId) => {
  const { i18n } = useTranslation();
  const products = useProductStore((state) => state.products);
  const getProductById = useProductStore((state) => state.getProductById);

  const translatedProduct = useMemo(() => {
    const product = getProductById(productId);
    return translateProduct(product);
  }, [productId, getProductById, products, i18n.language]);

  return translatedProduct;
};

export const useTranslatedFeaturedProduct = () => {
  const { i18n } = useTranslation();
  const products = useProductStore((state) => state.products);
  const getFeaturedProduct = useProductStore((state) => state.getFeaturedProduct);

  const translatedFeaturedProduct = useMemo(() => {
    const product = getFeaturedProduct();
    return translateProduct(product);
  }, [getFeaturedProduct, products, i18n.language]);

  return translatedFeaturedProduct;
};
