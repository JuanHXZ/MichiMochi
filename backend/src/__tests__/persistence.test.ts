import { jest } from '@jest/globals';
import { PostgresProductRepository } from '../modules/catalog/infrastructure/repositories/PostgresProductRepository.js';
import { PostgresOtpRepository } from '../modules/auth/infrastructure/repositories/PostgresOtpRepository.js';
import { INITIAL_PRODUCTS } from '../modules/catalog/infrastructure/repositories/initialProducts.js';

describe('PostgreSQL Persistence Repositories (P0.2)', () => {
  it('should load products directly from PostgreSQL and map fields cleanly', async () => {
    const queryMock = jest.fn<any>().mockResolvedValueOnce({
      rows: [
        {
          id: 'prod_pg_1',
          name: 'Sakura Mochi',
          short_name: 'Sakura',
          description: 'Spring cherry blossom mochi',
          long_description: null,
          price: '5.50',
          original_price: '6.00',
          discount: 8,
          category: 'Special',
          image: '/assets/sakura.png',
          images: ['/assets/sakura.png'],
          featured: true,
          in_stock: true,
          stock: 15,
          rating: '4.90',
          review_count: 10,
          flavors: [],
          ingredients: [],
          allergens: [],
          nutritional_info: null,
          tags: ['Seasonal'],
          preparation_time: null,
          best_served_at: null,
          created_at: new Date('2026-02-01T00:00:00.000Z'),
          updated_at: new Date('2026-02-01T00:00:00.000Z'),
        },
      ],
    });

    const repo = new PostgresProductRepository({ query: queryMock } as any);
    const items = await repo.findAll({ category: 'Special' });

    expect(queryMock).toHaveBeenCalledTimes(1);
    expect(items).toHaveLength(1);
    expect(items[0].id).toBe('prod_pg_1');
    expect(items[0].price).toBe(5.5);
    expect(items[0].inStock).toBe(true);
  });

  it('should seed initial products only when table is empty (idempotent)', async () => {
    const clientQuery = jest.fn<any>().mockResolvedValue({ rowCount: 1 });
    const clientRelease = jest.fn<any>();
    const pool = {
      query: jest
        .fn<any>()
        .mockResolvedValueOnce({ rows: [{ count: 0 }] })
        .mockResolvedValueOnce({ rows: [{ count: 4 }] }),
      connect: jest.fn<any>().mockResolvedValue({
        query: clientQuery,
        release: clientRelease,
      }),
    } as any;

    const repo = new PostgresProductRepository(pool);
    const firstSeed = await repo.seedIfEmpty(INITIAL_PRODUCTS);
    expect(firstSeed).toBe(INITIAL_PRODUCTS.length);
    expect(clientRelease).toHaveBeenCalledTimes(1);

    const secondSeed = await repo.seedIfEmpty(INITIAL_PRODUCTS);
    expect(secondSeed).toBe(0);
  });

  it('should propagate PostgreSQL errors instead of swallowing them', async () => {
    const pool = {
      query: jest.fn<any>().mockRejectedValueOnce(new Error('Connection refused')),
    } as any;

    const repo = new PostgresProductRepository(pool);
    await expect(
      repo.create({
        ...INITIAL_PRODUCTS[0],
        id: 'fail-id',
      })
    ).rejects.toThrow(/PostgreSQL/i);
  });

  it('should clear featured flag on all other products in PostgreSQL', async () => {
    const queryMock = jest.fn<any>().mockResolvedValueOnce({ rowCount: 1 });
    const repo = new PostgresProductRepository({ query: queryMock } as any);

    await repo.clearFeatured('2');

    expect(queryMock).toHaveBeenCalledWith(
      'UPDATE products SET featured = FALSE WHERE featured = TRUE AND id <> $1',
      ['2']
    );
  });

  it('should persist OTP and increment attempts atomically in PostgreSQL', async () => {
    const pool = {
      query: jest
        .fn<any>()
        .mockResolvedValueOnce({ rowCount: 1 })
        .mockResolvedValueOnce({
          rows: [
            {
              code_hash: 'abc123',
              expires_at: new Date(Date.now() + 60_000),
              created_at: new Date(),
              attempts: 0,
            },
          ],
        })
        .mockResolvedValueOnce({
          rows: [{ attempts: 1 }],
        }),
    } as any;

    const otpRepo = new PostgresOtpRepository(pool);
    await otpRepo.save('User@MichiMochi.com', {
      codeHash: 'abc123',
      expiresAt: Date.now() + 60_000,
      createdAt: Date.now(),
      attempts: 0,
    });

    const loaded = await otpRepo.findByEmail('user@michimochi.com');
    expect(loaded?.codeHash).toBe('abc123');

    const attempts = await otpRepo.incrementAttempts('user@michimochi.com');
    expect(attempts).toBe(1);
  });
});
