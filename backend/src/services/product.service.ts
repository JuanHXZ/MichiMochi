import { ENV } from '../config/env.js';
import { adminDb } from '../config/firebaseAdmin.js';
import { Product, CreateProductDTO, UpdateProductDTO, ProductFilterQuery } from '../types/product.js';

// Catálogo inicial con los productos característicos de MichiMochi
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
    images: ['/assets/matcha1.png'],
    featured: true,
    inStock: true,
    stock: 25,
    rating: 4.95,
    reviewCount: 520,
    flavors: [
      { id: 'ceremonial-uji', name: 'Ceremonial Uji', description: 'Pure green tea notes', color: '#4d7c0f' },
    ],
    ingredients: ['Uji Kyoto Matcha', 'Mochiko rice flour', 'Azuki red beans', 'Organic cane sugar'],
    allergens: ['None'],
    nutritionalInfo: { calories: 150, protein: '3g', carbs: '30g', fat: '1.5g', sugar: '16g' },
    tags: ['Signature', 'Antioxidants', 'Traditional'],
    preparationTime: 'Freshly steamed daily',
    bestServedAt: 'Room temperature with hot green tea',
    createdAt: '2026-01-03T00:00:00.000Z',
  },
];

// Almacén en memoria sincronizado con el ciclo de vida del backend
const productsStore = new Map<string, Product>(INITIAL_PRODUCTS.map((p) => [p.id, { ...p }]));

export class ProductService {
  private static isFirestoreConfigured(): boolean {
    return Boolean(ENV.FIREBASE_CLIENT_EMAIL && ENV.FIREBASE_PRIVATE_KEY);
  }

  /**
   * Obtiene todos los productos con filtros opcionales (categoría, búsqueda, featured, inStock)
   */
  static async getAll(filters?: ProductFilterQuery): Promise<Product[]> {
    let products = Array.from(productsStore.values());

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

  /**
   * Obtiene un producto por su ID
   * @throws 404 si el producto no existe
   */
  static async getById(id: string): Promise<Product> {
    const product = productsStore.get(id);
    if (!product) {
      throw { status: 404, message: `Producto con ID '${id}' no encontrado en el catálogo.` };
    }
    return product;
  }

  /**
   * Agrega un nuevo producto al catálogo
   */
  static async create(data: CreateProductDTO): Promise<Product> {
    const id = data.id || `prod_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    if (productsStore.has(id)) {
      throw { status: 409, message: `Ya existe un producto con el ID '${id}'.` };
    }

    // Validar duplicidad por nombre (case-insensitive y trim)
    const normalizedName = data.name.trim().toLowerCase();
    const existingByName = Array.from(productsStore.values()).find(
      (p) => p.name.trim().toLowerCase() === normalizedName
    );
    if (existingByName) {
      throw { status: 409, message: `Ya existe un producto con el nombre '${data.name.trim()}'.` };
    }

    const now = new Date().toISOString();
    const newProduct: Product = {
      ...data,
      name: data.name.trim(),
      id,
      inStock: data.inStock !== undefined ? data.inStock : true,
      stock: data.stock !== undefined ? data.stock : 10,
      rating: data.rating ?? 5.0,
      reviewCount: data.reviewCount ?? 0,
      createdAt: now,
      updatedAt: now,
    };

    productsStore.set(id, newProduct);

    // Persistir en Firestore si está configurado
    if (this.isFirestoreConfigured()) {
      try {
        await adminDb.collection('products').doc(id).set(newProduct);
      } catch (err) {
        console.warn(`[ProductService] Advertencia al persistir producto '${id}' en Firestore:`, err);
      }
    }

    return newProduct;
  }

  /**
   * Actualiza un producto existente por su ID
   * @throws 404 si el producto no existe
   */
  static async update(id: string, data: UpdateProductDTO): Promise<Product> {
    const existing = productsStore.get(id);
    if (!existing) {
      throw { status: 404, message: `Producto con ID '${id}' no encontrado en el catálogo.` };
    }

    // Validar duplicidad si se actualiza el nombre
    if (data.name && data.name.trim()) {
      const normalizedName = data.name.trim().toLowerCase();
      const existingByName = Array.from(productsStore.values()).find(
        (p) => p.id !== id && p.name.trim().toLowerCase() === normalizedName
      );
      if (existingByName) {
        throw { status: 409, message: `Ya existe otro producto con el nombre '${data.name.trim()}'.` };
      }
    }

    const updatedProduct: Product = {
      ...existing,
      ...data,
      ...(data.name && { name: data.name.trim() }),
      id: existing.id, // ID inmutable
      createdAt: existing.createdAt, // createdAt inmutable
      updatedAt: new Date().toISOString(),
    };

    productsStore.set(id, updatedProduct);

    // Actualizar en Firestore si está configurado
    if (this.isFirestoreConfigured()) {
      try {
        await adminDb.collection('products').doc(id).set(updatedProduct, { merge: true });
      } catch (err) {
        console.warn(`[ProductService] Advertencia al actualizar producto '${id}' en Firestore:`, err);
      }
    }

    return updatedProduct;
  }

  /**
   * Elimina un producto por su ID
   * @throws 404 si el producto no existe
   */
  static async delete(id: string): Promise<{ id: string; name: string }> {
    const existing = productsStore.get(id);
    if (!existing) {
      throw { status: 404, message: `Producto con ID '${id}' no encontrado en el catálogo.` };
    }

    productsStore.delete(id);

    // Eliminar de Firestore si está configurado
    if (this.isFirestoreConfigured()) {
      try {
        await adminDb.collection('products').doc(id).delete();
      } catch (err) {
        console.warn(`[ProductService] Advertencia al eliminar producto '${id}' de Firestore:`, err);
      }
    }

    return { id, name: existing.name };
  }

  /**
   * Reinicia el catálogo a su estado base (útil para pruebas unitarias)
   */
  static resetToInitial(): void {
    productsStore.clear();
    for (const p of INITIAL_PRODUCTS) {
      productsStore.set(p.id, { ...p });
    }
  }
}
