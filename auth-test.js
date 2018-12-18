process.env.NODE_ENV = 'test';

const app = require('./app');
const testApp = require('supertest')(app);
const db = require('./db');

let auth = {};

beforeAll(async () => {
  await db.query(`DELETE FROM users`);
  const response = await testApp.post('/auth/register').send({
    username: 'test',
    password: 'test',
    first_name: 'test',
    last_name: 'also_test',
    phone: '1111111'
  });
  auth._token = response.body.token;
  auth.username = 'test';
});

afterAll(async () => {
  await db.end();
});

describe('POST /register', async () => {
  test('it returns a token when registering a new user', async () => {
    const response = await testApp.post('/auth/register').send({
      username: 'test2',
      password: 'test2',
      first_name: 'test2',
      last_name: 'also_test2',
      phone: '1111112'
    });
    // expect(response.statusCode).toEqual(200);
    // expect(response.body).toHaveProperty('token');
    // const token = response.body.token;
  });

  test('it fails when registering an existing user', async () => {
    const response = await testApp.post('/auth/register').send({
      username: 'test',
      password: 'test',
      first_name: 'test',
      last_name: 'also_test',
      phone: '1111111'
    });
    // expect(response.statusCode).toEqual(409);
    // INCOMPLETE
  });
});

//  Below is for reference

// router.post('/login', async function login(req, res, next) {
//   try {
//     const { username, password } = req.body;
//     if (User.authenticate(username, password)) {
//       const token = jwt.sign({ username }, SECRET_KEY);
//       User.updateLoginTimestamp(username);
//       return res.json({ token });
//     } else {
//       const err = new Error('not valid username/pw');
//       err.status = 401;
//       throw err;
//     }
//   } catch (err) {
//     next(err);
//   }
// });

// /** POST /register - register user: registers, logs in, and returns token.
//  *
//  * {username, password, first_name, last_name, phone} => {token}.
//  *
//  *  Make sure to update their last-login!
//  */

// router.post('/register', async function register(req, res, next) {
//   try {
//     console.log('we are here', req.body);
//     const { username, password, first_name, last_name, phone } = req.body;

//     await User.register({
//       username,
//       password,
//       first_name,
//       last_name,
//       phone
//     });
//     const token = jwt.sign({ username }, SECRET_KEY); //jwt is sync
//     return res.json({ token });
//   } catch (err) {
//     next(err);
//   }
// });
