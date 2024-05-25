import redis from '@redis/client';
import config from './config.js';

const client = redis.createClient({
  url: config.redisURI,
});

export async function redisConnect() {
  const connection = client
    .connect()
    .then(() => console.log('Redis connected !'))
    .catch((error) => {
      console.error('Redis connection error:', error);
      process.exit(-1);
    });
  return connection;
}

function getRefreshTokenKey(email) {
  return `auth:${email}:refresh_token`;
}

function getResetPasswordKey(email) {
  return `auth:${email}:password_reset_code`;
}

export { client, getRefreshTokenKey, getResetPasswordKey };
