import path from 'path';
import dotenv from 'dotenv-safe';

// import .env variables
const __dirname = path.dirname(new URL(import.meta.url).pathname);
dotenv.config({
  path: path.join(__dirname, '../../.env'),
  example: path.join(__dirname, '../../.env.example'),
});

export default {
  env: process.env.NODE_ENV,
  port: process.env.PORT,
  baseURL: `http://${process.env.BASE_HOST}:${process.env.PORT}`,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpirationInterval: process.env.JWT_EXPIRATION_MINUTES,
  refreshExpirationDays: process.env.REFRESH_TOKEN_EXPIRATION_DAYS,
  mongo: {
    uri: process.env.NODE_ENV === 'test' ? process.env.MONGO_URI_TESTS : process.env.MONGO_URI,
  },
  redisURI: process.env.REDIS_URI,
  logs: process.env.NODE_ENV === 'production' ? 'combined' : 'dev',
  googleConfig: {
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  },
  facebookConfig: {
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
  },
  emailConfig: {
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    username: process.env.EMAIL_USERNAME,
    password: process.env.EMAIL_PASSWORD,
  },
};
