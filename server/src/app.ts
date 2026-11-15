import express from 'express';
import cors from 'cors';
import { itemsRouter } from './routes/items';
import { shoppingListRouter } from './routes/shoppingList';

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.use('/api/items', itemsRouter);
  app.use('/api/shopping-list', shoppingListRouter);

  // Unknown route
  app.use((_req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  // Malformed JSON and other errors
  app.use(
    (err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
      const status = typeof err?.status === 'number' ? err.status : 500;
      res.status(status).json({ error: err?.message ?? 'Internal Server Error' });
    }
  );

  return app;
}