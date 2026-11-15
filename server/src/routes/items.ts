import { Router } from 'express';

// TODO: implement GET, POST, PATCH, DELETE per BRIEF.md.
export const itemsRouter = Router();

itemsRouter.use((_req, res) => {
  res.status(501).json({ error: 'Not implemented' });
});