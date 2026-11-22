export interface IFavoriteRepository {
  findProductIdsByUser(userId: string): Promise<string[]>;
  add(userId: string, productId: string): Promise<string[]>;
  remove(userId: string, productId: string): Promise<string[]>;
  reset?(): void;
}
