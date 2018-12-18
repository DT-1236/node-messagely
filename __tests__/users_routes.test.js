process.env.NODE_ENV = 'test';

const app = require('../app');
const testApp = require('supertest')(app);
const db = require('../db');
const bcrypt = require('bcrypt');
const User = require('../models/user');
const jwt = require('jsonwebtoken');
const { SECRET_KEY } = require('../config.js');

let user;
let auth = {};

beforeEach(async () => {
  await db.query(`DELETE FROM users`);
  const hashedPassword = await bcrypt.hash('test', 1);
  user = await User.register({
    username: 'test',
    password: hashedPassword,
    first_name: 'test',
    last_name: 'test',
    phone: '8675309'
  });
  auth._token = jwt.sign({ username: user.username }, SECRET_KEY);
});

afterAll(async () => {
  await db.end();
});

describe('GET /users/', async () => {
  test('it returns a list of users when logged in', async () => {
    const response = await testApp.get('/users/').send({ _token: auth._token });
    expect(response.status).toEqual(200);
    const users = response.body;
    expect(users).toHaveLength(1);
    const gotUser = users[0];
    expect(gotUser.username).toEqual(user.username);
    expect(gotUser.first_name).toEqual(user.first_name);
    expect(gotUser.last_name).toEqual(user.last_name);
  });

  test('it returns a 401 when logged out', async () => {
    const response = await testApp.get('/users/');
    expect(response.error.status).toEqual(401);
    // Error message construction probably needs to be adjusted
    expect(response.body.error.status).toEqual(401);
    expect(response.body.message).toEqual('Unauthorized');
  });

  test('it returns a 401 with garbage token', async () => {
    const response = await testApp.get('/users/').send({ _token: 'crap' });
    expect(response.error.status).toEqual(401);
    expect(response.body.message).toEqual('Unauthorized');
  });
});

//  For reference

// router.get('/', ensureLoggedIn, async function getAll(req, res, next) {
//   return res.json(await User.all());
// });

// /** GET /:username - get detail of users.
//  *
//  * => {user: {username, first_name, last_name, phone, join_at, last_login_at}}
//  *
//  **/

// router.get(
//   '/:username',
//   ensureLoggedIn,
//   ensureCorrectUser,
//   async function getDetails(req, res, next) {
//     return res.json(await User.get(req.username));
//   }
// );

// /** GET /:username/to - get messages to user
//  *
//  * => {messages: [{id,
//  *                 body,
//  *                 sent_at,
//  *                 read_at,
//  *                 from_user: {username, first_name, last_name, phone}}, ...]}
//  *
//  **/

// router.get(
//   '/:username/to',
//   ensureLoggedIn,
//   ensureCorrectUser,
//   async function getToMsgs(req, res, next) {
//     const getToMsgs = await User.messagesTo(req.username);
//     return res.json(getToMsgs);
//   }
// );

// /** GET /:username/from - get messages from user
//  *
//  * => {messages: [{id,
//  *                 body,
//  *                 sent_at,
//  *                 read_at,
//  *                 to_user: {username, first_name, last_name, phone}}, ...]}
//  *
//  **/
// router.get(
//   '/:username/from',
//   ensureLoggedIn,
//   ensureCorrectUser,
//   async function getFromMsgs(req, res, next) {
//     const getFromMsgs = await User.messagesFrom(req.username);
//     return res.json(getFromMsgs);
//   }
// );

// module.exports = router;
