import express from 'express';

const router = express.Router();

// Ruta para la página de inicio
router.get('/', (req, res) => {
  res.render('gestor-gastos', {
    pagina: 'Inicio',
    titulo: 'Dash board | Inicio', // Título dinámico
  });
});

export default router;