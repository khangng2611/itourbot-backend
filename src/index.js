// make bluebird default Promise
// import {Promise} from 'bluebird'; // eslint-disable-line no-global-assign
import vars from './config/vars.js';
import logger from './config/logger.js';
import app from './config/express.js';
import connect from './config/mongoose.js';

// open mongoose connection
connect();

// listen to requests
app.listen(vars.port, () => logger.info(`server started on port ${vars.port} (${vars.env})`));

/**
* Exports express
* @public
*/
export default app;
