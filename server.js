import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import router from './routes/routes.js'; // Importas el enrutador
import 'dotenv/config'; // Cargar variables de entorno desde .env

const app = express();

// Configuración de __dirname para módulos ES
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Definir puerto y entorno desde variables de entorno
const port =  process.env.PORT; 
const env = process.env.NODE_ENV || 'development'; 

// Habilitar EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views')); // Configura la carpeta de vistas

// Middleware para archivos estáticos
app.use(express.static('public'));

// Definir rutas
app.use('/', router); // Usas el enrutador

// Iniciar servidor
app.listen(port, () => {
  console.log(`El servidor se está ejecutando en el puerto: ${port}`);
  console.log(`Entorno: ${env}`);
});


app.use(function (err, req, res, next) {
  console.error(err.stack)
  res.status(500).send('Something broke!')
});