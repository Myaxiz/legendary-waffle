import { Router } from 'express';

// TODO: implement GET, POST, PATCH, DELETE per BRIEF.md.
export const shoppingListRouter = Router();

shoppingListRouter.use((_req, res) => {
  res.status(501).json({ error: 'Not implemented' });
});