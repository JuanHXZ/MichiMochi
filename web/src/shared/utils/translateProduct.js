import i18n from '@/i18n';

const PRODUCT_KEY_MAP = {
  '1': 'strawberryDream',
  '2': 'mangoSunshine',
  '3': 'matchaZen',
  '4': 'velvetChocolate',
};

const SEED_DEFAULTS = {
  strawberryDream: {
    name: ['Strawberry Dream Mochi'],
    shortName: ['Strawberry Dream'],
    description: ['Fresh whole strawberry with sweet red bean paste'],
    longDescription: [
      'A cloud-like pillow of premium rice dough infused with natural beet juice, enveloping a whole, sun-ripened strawberry and sweet white bean paste.',
      'A cloud-like pillow of premium rice dough infused with natural beet juice, enveloping a whole, sun-ripened strawberry and sweet white bean paste. Our signature seasonal treat.',
    ],
  },
  mangoSunshine: {
    name: ['Mango Sunshine Mochi'],
    shortName: ['Mango Sunshine'],
    description: ['Alphonso mango nectar with coconut cream'],
    longDescription: [
      'Tropical paradise in every bite. Made with sweet Alphonso mango purée and creamy coconut filling, wrapped in vibrant orange-tinted mochi.',
      'Tropical paradise in every bite. Made with sweet Alphonso mango purée and creamy coconut filling, wrapped in vibrant orange-tinted mochi. A refreshing summer favorite.',
    ],
  },
  matchaZen: {
    name: ['Matcha Zen Mochi'],
    shortName: ['Matcha Zen'],
    description: [
      'Ceremonial Uji matcha infused dough with rich red bean paste',
      'Premium Uji matcha with sweet red bean',
    ],
    longDescription: [
      'Authentic ceremonial-grade green tea powder from Uji, Kyoto delivers an earthy, bittersweet experience balanced by traditional azuki bean filling.',
      'Crafted with authentic ceremonial-grade Uji matcha from Kyoto. The earthy, umami-rich green tea flavor pairs perfectly with smooth azuki red bean paste. A traditional Japanese delicacy.',
    ],
  },
  velvetChocolate: {
    name: ['Velvet Chocolate Mochi'],
    shortName: ['Velvet Chocolate'],
    description: ['Dark cocoa & silky ganache'],
    longDescription: [
      'Indulge in our premium chocolate mochi filled with rich dark cocoa ganache. Made with Belgian chocolate and wrapped in soft, chewy mochi. A perfect balance of bitter and sweet.',
    ],
  },
};

function isUntouchedDefault(value, defaults = []) {
  if (!value || !String(value).trim()) return true;
  const normalized = String(value).trim().toLowerCase();
  return defaults.some((item) => item.trim().toLowerCase() === normalized);
}

/**
 * Translates product data based on current language, preserving admin-edited fields.
 * @param {Object} product - Original product object
 * @returns {Object} Translated product object
 */
export const translateProduct = (product) => {
  if (!product) return product;

  const currentLang = String(i18n.resolvedLanguage || i18n.language || 'en').toLowerCase();

  // If English, return original product
  if (currentLang.startsWith('en')) return product;

  const productKey = PRODUCT_KEY_MAP[String(product.id)];
  if (!productKey) return product;

  const seed = SEED_DEFAULTS[productKey] || {};
  const t = i18n.t.bind(i18n);
  const nameUntouched = isUntouchedDefault(product.name, seed.name);
  const shortNameUntouched = isUntouchedDefault(product.shortName, seed.shortName);

  return {
    ...product,
    name: nameUntouched
      ? t(`products.${productKey}.name`, { defaultValue: product.name })
      : product.name,
    shortName:
      nameUntouched && shortNameUntouched
        ? t(`products.${productKey}.shortName`, { defaultValue: product.shortName })
        : product.shortName,
    description: isUntouchedDefault(product.description, seed.description)
      ? t(`products.${productKey}.description`, { defaultValue: product.description })
      : product.description,
    longDescription: isUntouchedDefault(product.longDescription, seed.longDescription)
      ? t(`products.${productKey}.longDescription`, { defaultValue: product.longDescription })
      : product.longDescription,
    tags: product.tags?.map((tag, index) => {
      const tagKeys = Object.keys(t(`products.${productKey}.tags`, { returnObjects: true }) || {});
      const tagKey = tagKeys[index];
      return tagKey ? t(`products.${productKey}.tags.${tagKey}`, { defaultValue: tag }) : tag;
    }),
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
