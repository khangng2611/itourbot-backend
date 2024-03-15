import config from './config/config.js';
import logger from './config/logger.js';
import app from './config/express.js';
import mongooseConnect from './config/mongoose.js';

const { port, env } = config;

// open mongoose connection
mongooseConnect();
// listen to requests
app.listen(port, () => logger.info(`Server started on port ${port} (${env})`));

/**
* Exports express
* @public
*/
export default app;
