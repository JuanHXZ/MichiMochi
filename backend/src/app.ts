import express, { Express } from 'express';
import cors from 'cors';
import { apiReference } from '@scalar/express-api-reference';
import { ENV } from './shared/config/env.js';
import { openApiSpec } from './shared/docs/openapi.js';
import authRoutes from './modules/auth/presentation/routes/auth.routes.js';
import productRoutes from './modules/catalog/presentation/routes/product.routes.js';
import { errorHandler } from './shared/middlewares/error.middleware.js';
import { AppError } from './shared/errors/AppError.js';

export const createApp = (): Express => {
  const app = express();

  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
    res.setHeader('X-Frame-Options', 'DENY');
    next();
  });

  const allowedOrigins = new Set(ENV.ALLOWED_ORIGINS);

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin) {
          callback(null, true);
          return;
        }
        if (allowedOrigins.has(origin)) {
          callback(null, true);
          return;
        }
        callback(AppError.forbidden(`Origen CORS no permitido: ${origin}`));
      },
      credentials: true,
    })
  );
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', service: 'michimochi-backend', timestamp: new Date().toISOString() });
  });

  if (ENV.ENABLE_API_DOCS) {
    app.get('/docs/openapi.json', (_req, res) => {
      res.setHeader('Content-Type', 'application/json');
      res.json(openApiSpec);
    });

    app.use(
      '/docs',
      apiReference({
        spec: {
          content: openApiSpec,
        },
        theme: 'purple',
        darkMode: true,
        metaData: {
          title: 'MichiMochi API Reference & Client',
        },
      })
    );
  }

  app.use('/api/auth', authRoutes);
  app.use('/api/products', productRoutes);

  app.use(errorHandler);

  return app;
};
