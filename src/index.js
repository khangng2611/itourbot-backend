// make bluebird default Promise
// import {Promise} from 'bluebird'; // eslint-disable-line no-global-assign
import vars from './config/vars';
import logger from './config/logger';
import app from './config/express';
import connect from './config/mongoose';

// open mongoose connection
connect();

// listen to requests
app.listen(vars.port, () => logger.info(`server started on port ${vars.port} (${vars.env})`));

/**
* Exports express
* @public
*/
export default app;
