import express from 'express';

const router = express.Router();

// Ruta para la página de inicio
router.get('/', (req, res) => {
  res.render('gestor-gastos', {
    titulo: 'Gestor de Gastos'
  });
});

export default router;