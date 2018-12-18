/** Common config for message.ly */

// read .env files and make environmental variables

require('dotenv').config();

const SECRET_KEY = process.env.SECRET_KEY || 'secret';
const BCRYPT_WORK_ROUNDS = 12;

const env = process.env.NODE_ENV;
const devURI = 'postgres:///messagely';
const testURI = 'postgres:///messagely-test';
const DB_URI = env === 'test' ? testURI : devURI;

module.exports = {
  SECRET_KEY,
  BCRYPT_WORK_ROUNDS,
  DB_URI
};
