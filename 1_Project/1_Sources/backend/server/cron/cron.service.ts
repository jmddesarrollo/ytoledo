const CronJob = require('cron').CronJob;

const sequelize = require('../../models').sequelize;

// Services
import FileService from '../../services/file';

export default class CronService {
    private fileService = new FileService('', []);

    constructor() {}

    /*
     * CronJob
     * Campo                Valores permitidos
     * minute	            0-59​​​
     * hour	                0-23
     * Day of the month	    1-31
     * month	            1-12 o JAN-DEC
     * Day of the week	    0-6 o SUN-SAT
     * 
     * minute hour day_of_month month day_of_week command_to_run
     * 
     * Ejemplos
     *     5 4 * * 0            echo "run at 5 minutes after 4 hour every sunday"
     *     23 0-23/2 * * *      echo "run 23 minutes after midnight, 2am, 4am ..., everyday"
     */

    /**
     * Job de ejemplo de uso con Cron
     */
    private jobExample = new CronJob('0 6-16 * * *', async () => {
        this.fileService.writeLog('example', `Example`);
    }, null, true, 'Europe/Madrid');

    public syncJobsStart() {
        // this.jobExample.start();
    }

    public syncJobsStop() {
        // this.jobExample.close();
    }

}
