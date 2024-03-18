import redis from '@redis/client';
import config from './config.js';

const redisClient = redis.createClient({
  url: config.redisURI,
});

export async function redisConnect() {
  const connection = redisClient
    .connect()
    .then(() => console.log('Redis connected !'))
    .catch((error) => {
      console.error('Redis connection error:', error);
      process.exit(-1);
    });
  return connection;
}

export { redisClient };
