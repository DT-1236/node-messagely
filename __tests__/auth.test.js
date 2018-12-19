process.env.NODE_ENV = 'test';

const app = require('../app');
const testApp = require('supertest')(app);
const db = require('../db');

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
    expect(response.status).toEqual(200);
    expect(response.body).toHaveProperty('token');
  });

  test('it fails when registering an existing user', async () => {
    const response = await testApp.post('/auth/register').send({
      username: 'test',
      password: 'test',
      first_name: 'test',
      last_name: 'also_test',
      phone: '1111111'
    });
    expect(response.status).toEqual(409);
    expect(response.body.error.message).toEqual('username must be unique');
  });
});

describe('POST /login', async () => {
  test('it returns a token with good credentials', async () => {
    const response = await testApp.post('/auth/login').send({
      username: 'test',
      password: 'test'
    });
    expect(response.status).toEqual(200);
    expect(response.body).toHaveProperty('token');
  });

  test('it rejects bad credentials', async () => {
    const response = await testApp.post('/auth/login').send({
      username: 'test',
      password: 'test2asdvadfb'
    });
    console.log(response.body);
    expect(response.body.error.status).toEqual(401);
    expect(response.body.error.message).toEqual('not valid username/pw');
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
