import bluebird from 'bluebird'; // eslint-disable-line no-global-assign
import mongoose from 'mongoose';
import logger from './logger.js';
import config from './config.js';

const { env, mongo } = config;
// set mongoose Promise to Bluebird
const { Promise } = bluebird;
mongoose.Promise = Promise;

// Exit application on error
mongoose.connection.on('error', (err) => {
  logger.error(`MongoDB connection error: ${err}`);
  process.exit(-1);
});

// print mongoose logs in dev env
if (env === 'development') {
  mongoose.set('debug', true);
}

/**
 * Connect to mongo db
 *
 * @returns {object} Mongoose connection
 * @public
 */
export default function mongooseConnect() {
  mongoose
    .connect(mongo.uri, {
      useCreateIndex: true,
      keepAlive: 1,
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: false,
    })
    .then(() => console.log('MongoDB connected !'))
    .catch((error) => {
      console.error('MongoDB connection error:', error);
      process.exit(-1);
    });
  return mongoose.connection;
}
