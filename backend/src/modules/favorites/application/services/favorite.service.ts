import { favoriteRepository } from '../../infrastructure/repositories/favoriteRepository.factory.js';
import { productRepository } from '../../../catalog/infrastructure/repositories/productRepository.factory.js';
import { Product } from '../../../catalog/domain/entities/Product.js';
import { AppError } from '../../../../shared/errors/AppError.js';

export interface FavoritesResult {
  productIds: string[];
  products: Product[];
}

export class FavoriteService {
  private static async resolveProducts(productIds: string[]): Promise<Product[]> {
    const resolved: Product[] = [];
    for (const id of productIds) {
      const product = await productRepository.findById(id);
      if (product) {
        resolved.push(product);
      }
    }
    return resolved;
  }

  static async getUserFavorites(userId: string): Promise<FavoritesResult> {
    const productIds = await favoriteRepository.findProductIdsByUser(userId);
    const products = await FavoriteService.resolveProducts(productIds);
    return {
      productIds: products.map((p) => p.id),
      products,
    };
  }

  static async addFavorite(userId: string, productId: string): Promise<FavoritesResult> {
    const product = await productRepository.findById(productId);
    if (!product) {
      throw AppError.notFound(`El producto con ID '${productId}' no existe en el catálogo.`);
    }

    const productIds = await favoriteRepository.add(userId, productId);
    const products = await FavoriteService.resolveProducts(productIds);
    return {
      productIds: products.map((p) => p.id),
      products,
    };
  }

  static async removeFavorite(userId: string, productId: string): Promise<FavoritesResult> {
    const productIds = await favoriteRepository.remove(userId, productId);
    const products = await FavoriteService.resolveProducts(productIds);
    return {
      productIds: products.map((p) => p.id),
      products,
    };
  }
}
