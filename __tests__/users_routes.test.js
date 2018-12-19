process.env.NODE_ENV = 'test';

const app = require('../app');
const testApp = require('supertest')(app);
const db = require('../db');
const bcrypt = require('bcrypt');
const User = require('../models/user');
const Message = require('../models/message');
const jwt = require('jsonwebtoken');
const { SECRET_KEY } = require('../config.js');

let user;
let auth = {};
let user2;
let msgFromUser2ToUser;
let msgFromUserToUser2;

beforeAll(async () => {
  const hashedPassword = await bcrypt.hash('test', 1);
  user = await User.register({
    username: 'test',
    password: hashedPassword,
    first_name: 'test',
    last_name: 'test',
    phone: '8675309'
  });

  auth._token = jwt.sign({ username: user.username }, SECRET_KEY);

  const hashedPassword2 = await bcrypt.hash('test2', 1);
  user2 = await User.register({
    username: 'test2',
    password: hashedPassword2,
    first_name: 'test2',
    last_name: 'test2',
    phone: '8675304'
  });

  msgFromUserToUser2 = await Message.create({
    from_username: user.username,
    to_username: user2.username,
    body: 'testingUserToUser2'
  });

  msgFromUser2ToUser = await Message.create({
    from_username: user2.username,
    to_username: user.username,
    body: 'testingUser2ToUser'
  });
});

afterAll(async () => {
  await db.query(`DELETE FROM messages`);
  await db.query(`DELETE FROM users`);

  await db.end();
});
// afterEach(async () => {
// });

describe('GET /users/', async () => {
  test('it returns a list of users when logged in', async () => {
    const response = await testApp.get('/users/').send({ _token: auth._token });
    expect(response.status).toEqual(200);
    const users = response.body;
    expect(users).toHaveLength(2);
    const gotUser = users[0];
    expect(gotUser.username).toEqual(user.username);
    expect(gotUser.first_name).toEqual(user.first_name);
    expect(gotUser.last_name).toEqual(user.last_name);
  });

  test('it returns a 401 when logged out', async () => {
    const response = await testApp.get('/users/');
    expect(response.body.error.status).toEqual(401);
    expect(response.body.error.message).toEqual('Unauthorized');
  });

  test('it returns a 401 with garbage token', async () => {
    const response = await testApp.get('/users/').send({ _token: 'crap' });
    expect(response.body.error.status).toEqual(401);
    expect(response.body.error.message).toEqual('Unauthorized');
  });
});

describe('GET /users/:username', async () => {
  test('it gets the details of the user', async () => {
    const response = await testApp
      .get(`/users/${user.username}`)
      .send({ _token: auth._token });
    expect(response.status).toEqual(200);
    const userDetailObj = response.body;
    expect(userDetailObj).toHaveProperty('username', 'test');
    expect(userDetailObj).toHaveProperty('first_name', 'test');
    expect(userDetailObj).toHaveProperty('last_name', 'test');
    expect(userDetailObj).toHaveProperty('phone', '8675309');
    expect(userDetailObj).toHaveProperty('join_at');
    expect(userDetailObj).toHaveProperty('last_login_at');
  });

  test('it returns a 401 when logged out', async () => {
    const response = await testApp.get(`/users/${user.username}`);
    expect(response.body.error.status).toEqual(401); // testing key in obj
    expect(response.body.error.message).toEqual('Unauthorized');
  });

  test('it returns a 401 with garbage token', async () => {
    const response = await testApp
      .get(`/users/${user.username}`)
      .send({ _token: 'crap' });
    expect(response.body.error.status).toEqual(401);
    expect(response.body.error.message).toEqual('Unauthorized');
  });
});

describe('GET /users/:username/from', async () => {
  test('it get messages from user', async () => {
    let url = `/users/test/from`;
    const response = await testApp.get(url).send({ _token: auth._token });
    expect(response.status).toEqual(200);

    const fromUserMsg = response.body[0];
    expect(fromUserMsg.to_user).toHaveProperty('username', user2.username);
    expect(fromUserMsg).toHaveProperty('body', msgFromUserToUser2.body);
    expect(fromUserMsg).toHaveProperty('sent_at');
  });

  test('it returns a 401 when logged out', async () => {
    let url = `/users/test/from`;
    const response = await testApp.get(url);
    expect(response.body.error.status).toEqual(401); // testing key in obj
    expect(response.body.error.message).toEqual('Unauthorized');
  });

  test('it returns a 401 with garbage token', async () => {
    let url = `/users/test/from`;
    const response = await testApp.get(url).send({ _token: 'crap' });
    expect(response.body.error.status).toEqual(401);
    expect(response.body.error.message).toEqual('Unauthorized');
  });
});

describe('GET /users/:username/to', async () => {
  let url = `/users/test/to`;

  test('it get messages to user', async () => {
    const response = await testApp.get(url).send({ _token: auth._token });
    expect(response.status).toEqual(200);

    const toUserMsg = response.body[0];
    expect(toUserMsg.from_user).toHaveProperty('username', user2.username);
    expect(toUserMsg).toHaveProperty('body', msgFromUser2ToUser.body);
    expect(toUserMsg).toHaveProperty('sent_at');
  });

  test('it returns a 401 when logged out', async () => {
    const response = await testApp.get(url);
    expect(response.body.error.status).toEqual(401); // testing key in obj
    expect(response.body.error.message).toEqual('Unauthorized');
  });

  test('it returns a 401 with garbage token', async () => {
    const response = await testApp.get(url).send({ _token: 'crap' });
    expect(response.body.error.status).toEqual(401);
    expect(response.body.error.message).toEqual('Unauthorized');
  });
});
