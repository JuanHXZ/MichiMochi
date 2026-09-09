import express, { Express } from 'express';
import cors from 'cors';
import { apiReference } from '@scalar/express-api-reference';
import { ENV } from './config/env.js';
import { openApiSpec } from './docs/openapi.js';
import authRoutes from './routes/auth.routes.js';
import productRoutes from './routes/product.routes.js';
import { errorHandler } from './middlewares/error.middleware.js';

export const createApp = (): Express => {
  const app = express();

  // Middlewares globales
  app.use(
    cors({
      origin: ENV.CORS_ORIGIN === '*' ? true : ENV.CORS_ORIGIN.split(','),
      credentials: true,
    })
  );
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Health check
  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', service: 'michimochi-backend', timestamp: new Date().toISOString() });
  });

  // OpenAPI JSON Spec
  app.get('/docs/openapi.json', (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.json(openApiSpec);
  });

  // Scalar Interactive API Documentation & REST Client
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

  // Rutas API
  app.use('/api/auth', authRoutes);
  app.use('/api/products', productRoutes);

  // Middleware de errores
  app.use(errorHandler);

  return app;
};
