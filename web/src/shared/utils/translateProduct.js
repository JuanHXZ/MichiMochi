import i18n from '@/i18n';

/**
 * Translates product data based on current language
 * @param {Object} product - Original product object
 * @returns {Object} Translated product object
 */
export const translateProduct = (product) => {
  if (!product) return product;

  const currentLang = i18n.language;
  
  // If English, return original product
  if (currentLang === 'en') return product;

  // Map product IDs to translation keys
  const productKeyMap = {
    '1': 'strawberryDream',
    '2': 'mangoSunshine',
    '3': 'matchaZen',
    '4': 'velvetChocolate'
  };

  const productKey = productKeyMap[product.id];
  
  if (!productKey) return product;

  // Get translations from i18n
  const t = i18n.t;
  
  return {
    ...product,
    name: t(`products.${productKey}.name`, { defaultValue: product.name }),
    shortName: t(`products.${productKey}.shortName`, { defaultValue: product.shortName }),
    description: t(`products.${productKey}.description`, { defaultValue: product.description }),
    longDescription: t(`products.${productKey}.longDescription`, { defaultValue: product.longDescription }),
    tags: product.tags?.map((tag, index) => {
      const tagKeys = Object.keys(t(`products.${productKey}.tags`, { returnObjects: true }) || {});
      const tagKey = tagKeys[index];
      return tagKey ? t(`products.${productKey}.tags.${tagKey}`, { defaultValue: tag }) : tag;
    })
  };
};

/**
 * Translates an array of products
 * @param {Array} products - Array of product objects
 * @returns {Array} Array of translated product objects
 */
export const translateProducts = (products) => {
  if (!products || !Array.isArray(products)) return products;
  return products.map(translateProduct);
};
