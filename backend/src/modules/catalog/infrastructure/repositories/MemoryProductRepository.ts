import { IProductRepository } from '../../domain/repositories/IProductRepository.js';
import { Product, ProductFilterQuery } from '../../domain/entities/Product.js';
import { ENV } from '../../../../shared/config/env.js';
import { adminDb } from '../../../../shared/config/firebaseAdmin.js';

const INITIAL_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Strawberry Dream Mochi',
    shortName: 'Strawberry Dream',
    description: 'Fresh whole strawberry with sweet red bean paste',
    longDescription: 'A cloud-like pillow of premium rice dough infused with natural beet juice, enveloping a whole, sun-ripened strawberry and sweet white bean paste.',
    price: 4.25,
    originalPrice: 4.25,
    discount: 0,
    category: 'Strawberry',
    image: '/assets/strawberry1.png',
    images: ['/assets/strawberry1.png', '/assets/strawberry2.png', '/assets/strawberry3.png'],
    featured: true,
    inStock: true,
    stock: 32,
    rating: 4.9,
    reviewCount: 412,
    flavors: [
      { id: 'classic-pink', name: 'Classic Pink', description: 'Sweet strawberry infused', color: '#ff69b4' },
      { id: 'white-cream', name: 'White Cream', description: 'Vanilla cream filling', color: '#fff8f0' },
    ],
    ingredients: ['Mochiko sweet rice flour', 'Fresh California strawberries', 'White bean paste (Shiro-an)', 'Pure cane sugar'],
    allergens: ['None'],
    nutritionalInfo: { calories: 160, protein: '2g', carbs: '32g', fat: '2g', sugar: '20g' },
    tags: ['Best Seller', 'Fresh Fruit', 'Light'],
    preparationTime: 'Made to order',
    bestServedAt: 'Chilled for best texture',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: '2',
    name: 'Mango Sunshine Mochi',
    shortName: 'Mango Sunshine',
    description: 'Alphonso mango nectar with coconut cream',
    longDescription: 'Tropical paradise in every bite. Made with sweet Alphonso mango purée and creamy coconut filling, wrapped in vibrant orange-tinted mochi.',
    price: 4.5,
    originalPrice: 5.25,
    discount: 14,
    category: 'Mango',
    image: '/assets/mango1.png',
    images: ['/assets/mango1.png', '/assets/mango2.png'],
    featured: false,
    inStock: true,
    stock: 38,
    rating: 4.6,
    reviewCount: 156,
    flavors: [
      { id: 'alphonso-mango', name: 'Alphonso Mango', description: 'King of mangoes', color: '#ffa500' },
      { id: 'mango-coconut', name: 'Mango Coconut', description: 'Tropical fusion', color: '#ffcc80' },
    ],
    ingredients: ['Alphonso mango purée', 'Sweet rice flour', 'Coconut cream', 'Organic sugar'],
    allergens: ['Coconut'],
    nutritionalInfo: { calories: 175, protein: '1.5g', carbs: '35g', fat: '3g', sugar: '22g' },
    tags: ['Tropical', 'Summer', 'Fruity'],
    preparationTime: 'Made to order',
    bestServedAt: 'Chilled for best texture',
    createdAt: '2026-01-02T00:00:00.000Z',
  },
  {
    id: '3',
    name: 'Matcha Zen Mochi',
    shortName: 'Matcha Zen',
    description: 'Ceremonial Uji matcha infused dough with rich red bean paste',
    longDescription: 'Authentic ceremonial-grade green tea powder from Uji, Kyoto delivers an earthy, bittersweet experience balanced by traditional azuki bean filling.',
    price: 4.75,
    originalPrice: 4.75,
    discount: 0,
    category: 'Matcha',
    image: '/assets/matcha1.png',
    images: ['/assets/matcha1.png', '/assets/matcha2.png', '/assets/matcha3.png'],
    featured: false,
    inStock: true,
    stock: 28,
    rating: 4.7,
    reviewCount: 189,
    flavors: [
      { id: 'ceremonial-matcha', name: 'Ceremonial Matcha', description: 'Premium Uji grade', color: '#87a96b' },
      { id: 'matcha-white-chocolate', name: 'Matcha White Chocolate', description: 'Sweet and earthy blend', color: '#c8e6c9' },
      { id: 'matcha-azuki', name: 'Matcha Red Bean', description: 'Traditional combination', color: '#7cb342' },
    ],
    ingredients: ['Ceremonial grade Uji matcha', 'Premium mochiko flour', 'Azuki red bean paste', 'Organic cane sugar', 'Rice starch', 'Pure water'],
    allergens: ['None'],
    nutritionalInfo: { calories: 170, protein: '4g', carbs: '30g', fat: '3g', sugar: '16g' },
    tags: ['Authentic', 'Matcha', 'Traditional'],
    preparationTime: 'Freshly pounded daily',
    bestServedAt: 'Room temperature',
    createdAt: '2026-01-03T00:00:00.000Z',
  },
  {
    id: '4',
    name: 'Velvet Chocolate Mochi',
    shortName: 'Velvet Chocolate',
    description: 'Dark cocoa & silky ganache',
    longDescription: 'Indulge in our premium chocolate mochi filled with rich dark cocoa ganache. Made with Belgian chocolate and wrapped in soft, chewy mochi. A perfect balance of bitter and sweet.',
    price: 4.5,
    originalPrice: 5.99,
    discount: 25,
    category: 'Chocolate',
    image: '/assets/chocolate1.png',
    images: ['/assets/chocolate1.png', '/assets/chocolate2.png', '/assets/chocolate3.png'],
    featured: false,
    inStock: true,
    stock: 45,
    rating: 4.8,
    reviewCount: 234,
    flavors: [
      { id: 'dark-chocolate', name: 'Dark Chocolate', description: '70% cocoa intensity', color: '#3d2817' },
      { id: 'milk-chocolate', name: 'Milk Chocolate', description: 'Creamy and sweet', color: '#8b4513' },
      { id: 'white-chocolate', name: 'White Chocolate', description: 'Smooth vanilla notes', color: '#f5f5dc' },
    ],
    ingredients: ['Premium mochiko rice flour', 'Belgian dark chocolate (70% cocoa)', 'Fresh cream', 'Pure cane sugar', 'Organic cornstarch', 'Sea salt'],
    allergens: ['Dairy', 'May contain traces of nuts'],
    nutritionalInfo: { calories: 180, protein: '3g', carbs: '28g', fat: '7g', sugar: '18g' },
    tags: ['Popular', 'Chocolate Lover', 'Premium'],
    preparationTime: 'Made fresh daily',
    bestServedAt: 'Room temperature or chilled',
    createdAt: '2026-01-04T00:00:00.000Z',
  },
];

export class MemoryProductRepository implements IProductRepository {
  private productsStore = new Map<string, Product>(INITIAL_PRODUCTS.map((p) => [p.id, { ...p }]));

  private isFirestoreConfigured(): boolean {
    return Boolean(ENV.FIREBASE_CLIENT_EMAIL && ENV.FIREBASE_PRIVATE_KEY);
  }

  async findAll(filters?: ProductFilterQuery): Promise<Product[]> {
    let products = Array.from(this.productsStore.values());

    if (filters?.category && filters.category !== 'All') {
      const cat = filters.category.toLowerCase();
      products = products.filter((p) => p.category.toLowerCase() === cat);
    }

    if (filters?.search && filters.search.trim()) {
      const q = filters.search.toLowerCase().trim();
      products = products.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.longDescription?.toLowerCase().includes(q) ||
          p.tags?.some((t) => t.toLowerCase().includes(q))
      );
    }

    if (filters?.featured !== undefined) {
      products = products.filter((p) => Boolean(p.featured) === filters.featured);
    }

    if (filters?.inStock !== undefined) {
      products = products.filter((p) => Boolean(p.inStock) === filters.inStock);
    }

    return products;
  }

  async findById(id: string): Promise<Product | null> {
    return this.productsStore.get(id) || null;
  }

  async findByName(name: string): Promise<Product | null> {
    const normalized = name.trim().toLowerCase();
    for (const p of this.productsStore.values()) {
      if (p.name.trim().toLowerCase() === normalized) {
        return p;
      }
    }
    return null;
  }

  async create(product: Product): Promise<Product> {
    this.productsStore.set(product.id, product);

    if (this.isFirestoreConfigured()) {
      try {
        await adminDb.collection('products').doc(product.id).set(product);
      } catch (err) {
        console.warn(`[MemoryProductRepository] Error al persistir producto en Firestore:`, err);
      }
    }

    return product;
  }

  async update(id: string, product: Product): Promise<Product> {
    this.productsStore.set(id, product);

    if (this.isFirestoreConfigured()) {
      try {
        await adminDb.collection('products').doc(id).set(product, { merge: true });
      } catch (err) {
        console.warn(`[MemoryProductRepository] Error al actualizar producto en Firestore:`, err);
      }
    }

    return product;
  }

  async delete(id: string): Promise<boolean> {
    const result = this.productsStore.delete(id);

    if (result && this.isFirestoreConfigured()) {
      try {
        await adminDb.collection('products').doc(id).delete();
      } catch (err) {
        console.warn(`[MemoryProductRepository] Error al eliminar producto de Firestore:`, err);
      }
    }

    return result;
  }

  resetToInitial(): void {
    this.productsStore.clear();
    for (const p of INITIAL_PRODUCTS) {
      this.productsStore.set(p.id, { ...p });
    }
  }
}

export const productRepository = new MemoryProductRepository();
