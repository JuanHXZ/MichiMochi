import { createApp } from './app.js';
import { ENV } from './shared/config/env.js';
import { getPgPool } from './shared/database/postgres.js';
import { runMigrations } from './shared/database/migrate.js';
import { productRepository } from './modules/catalog/infrastructure/repositories/productRepository.factory.js';
import { INITIAL_PRODUCTS } from './modules/catalog/infrastructure/repositories/initialProducts.js';
import { promoCodeRepository } from './modules/promotions/infrastructure/repositories/promoCodeRepository.factory.js';
import { INITIAL_PROMOTIONS } from './modules/promotions/infrastructure/repositories/initialPromotions.js';

async function bootstrap(): Promise<void> {
  if (ENV.PERSISTENCE_MODE === 'postgres') {
    const pool = getPgPool();
    await runMigrations(pool);
    const inserted = (await productRepository.seedIfEmpty?.(INITIAL_PRODUCTS)) ?? 0;
    const insertedPromos = (await promoCodeRepository.seedIfEmpty?.(INITIAL_PROMOTIONS)) ?? 0;
    console.log(`PostgreSQL ready (seeded initial products: ${inserted}, promos: ${insertedPromos})`);
  }

  const app = createApp();
  const PORT = parseInt(ENV.PORT, 10) || 5000;

  app.listen(PORT, () => {
    console.log(`MichiMochi Dedicated Backend running on http://localhost:${PORT}`);
    console.log(`Environment: ${ENV.NODE_ENV} | Persistence: ${ENV.PERSISTENCE_MODE}`);
  });
}

bootstrap().catch((err) => {
  console.error('[Bootstrap Error] No se pudo iniciar el servidor:', err);
  process.exit(1);
});
