// En el .env se definen variables globales (variables de entorno) que se usan en la app
import * as dotenv from 'dotenv';
dotenv.config();

import Server from './server/server';

// Patrón Singleton para que solo se pueda instanciar una vez el Server
const server = Server.instance;

server.start(() => {
    console.log('Servidor lanzado en el puerto ' + server.port);
});

/**
 * Cron. Automatización de ejecución de procesos
 */
import CronService from './server/cron/cron.service';

const cronService = new CronService();
cronService.syncJobsStart();