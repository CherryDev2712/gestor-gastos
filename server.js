import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { getDB } from './db.js';
import 'dotenv/config';

const app = express();
app.use(express.json());

// Configuración de __dirname para módulos ES
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Definir puerto y entorno desde variables de entorno
const port = process.env.PORT || 3000;
const env = process.env.NODE_ENV || 'development';

// Habilitar EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware para archivos estáticos
app.use(express.static('public'));

// Inicializar y abrir la base de datos SQLite
let db;
(async () => {
  db = await getDB();
  await db.exec(`
    CREATE TABLE IF NOT EXISTS ordenes (
      id INTEGER PRIMARY KEY,
      nombre TEXT,
      fecha TEXT,
      tipoGasto TEXT,
      conceptoGasto TEXT,
      establecimiento TEXT,
      ticket TEXT,
      metodoPago TEXT,
      montoTotalOrden REAL,
      totalGastos INTEGER
    );
    CREATE TABLE IF NOT EXISTS gastos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ordenId INTEGER,
      tipoGasto TEXT,
      conceptoGasto TEXT,
      establecimiento TEXT,
      nombreProducto TEXT,
      unidades REAL,
      medidaUnidad TEXT,
      precioUnidad REAL,
      montoTotal REAL,
      fecha TEXT,
      FOREIGN KEY(ordenId) REFERENCES ordenes(id)
    );
  `);
})();

// ENDPOINTS API

// Obtener todas las órdenes
app.get('/api/ordenes', async (req, res) => {
  try {
    const ordenes = await db.all('SELECT * FROM ordenes');
    res.json(ordenes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Guardar una nueva orden (y sus gastos)
app.post('/api/ordenes', async (req, res) => {
  try {
    const o = req.body;
    await db.run(
      `INSERT INTO ordenes (id, nombre, fecha, tipoGasto, conceptoGasto, establecimiento, ticket, metodoPago, montoTotalOrden, totalGastos)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [o.id, o.nombre, o.fecha, o.tipoGasto, o.conceptoGasto, o.establecimiento, o.ticket, o.metodoPago, o.montoTotalOrden, o.totalGastos]
    );
    if (Array.isArray(o.gastos)) {
      const stmt = await db.prepare(
        `INSERT INTO gastos (ordenId, tipoGasto, conceptoGasto, establecimiento, nombreProducto, unidades, medidaUnidad, precioUnidad, montoTotal, fecha)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      );
      for (const g of o.gastos) {
        await stmt.run([
          o.id, g.tipoGasto, g.conceptoGasto, g.establecimiento, g.nombreProducto,
          g.unidades, g.medidaUnidad, g.precioUnidad, g.montoTotal, g.fecha
        ]);
      }
      await stmt.finalize();
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Obtener gastos de una orden
app.get('/api/ordenes/:id/gastos', async (req, res) => {
  try {
    const gastos = await db.all('SELECT * FROM gastos WHERE ordenId = ?', [req.params.id]);
    res.json(gastos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Aquí puedes agregar más endpoints para editar/eliminar órdenes y gastos

// Rutas de vistas (mantén tu router si lo necesitas)
import router from './routes/routes.js';
app.use('/', router);

// Iniciar servidor
app.listen(port, () => {
  console.log(`El servidor se está ejecutando en el puerto: ${port}`);
  console.log(`Entorno: ${env}`);
});

app.use(function (err, req, res, next) {
  console.error(err.stack)
  res.status(500).send('Something broke!')
});