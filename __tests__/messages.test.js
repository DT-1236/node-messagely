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

describe('GET /messages/:id', async () => {
  test('get detail of message', async () => {
    const response = await testApp
      .get(`/messages/${msgFromUserToUser2.id}`)
      .send({ _token: auth._token });
    const msg = response.body;
    expect(msg).toHaveProperty('id');
    expect(msg.from_user.username).toEqual(user.username);
    expect(msg.to_user.username).toEqual(user2.username);
  });

  test('it returns a 401 when logged out', async () => {
    const response = await testApp.get(`/messages/${msgFromUserToUser2.id}`);
    expect(response.body.error.status).toEqual(401);
    expect(response.body.error.message).toEqual('Unauthorized');
  });

  test('it returns a 401 with garbage token', async () => {
    const response = await testApp
      .get(`/messages/${msgFromUserToUser2.id}`)
      .send({ _token: 'crap' });
    expect(response.body.error.status).toEqual(401);
    expect(response.body.error.message).toEqual('Unauthorized');
  });
});

describe('POST /messages/', async () => {
  test('post message', async () => {
    const response = await testApp.post(`/messages/`).send({
      _token: auth._token,
      from_username: user.username,
      to_username: user2.username,
      body: 'testinginging'
    });
    const msg = response.body.message;
    expect(msg).toHaveProperty('id');
    expect(msg.from_username).toEqual(user.username);
    expect(msg.to_username).toEqual(user2.username);
    expect(msg.body).toEqual('testinginging');
  });

  test('it returns a 401 when logged out', async () => {
    const response = await testApp.get(`/messages/${msgFromUserToUser2.id}`);
    expect(response.body.error.status).toEqual(401);
    expect(response.body.error.message).toEqual('Unauthorized');
  });

  test('it returns a 401 with garbage token', async () => {
    const response = await testApp
      .get(`/messages/${msgFromUserToUser2.id}`)
      .send({ _token: 'crap' });
    expect(response.body.error.status).toEqual(401);
    expect(response.body.error.message).toEqual('Unauthorized');
  });
});

describe('POST messages/:id/read', async () => {
  test('read message from receiver', async () => {
    const response = await testApp
      .post(`/messages/${msgFromUser2ToUser.id}/read`)
      .send({ _token: auth._token });
    const msg = response.body.message;
    expect(msg).toHaveProperty('id');
    expect(msg).toHaveProperty('read_at');
  });

  test('it returns a 401 when logged out', async () => {
    const response = await testApp.get(`/messages/${msgFromUserToUser2.id}`);
    expect(response.body.error.status).toEqual(401);
    expect(response.body.error.message).toEqual('Unauthorized');
  });

  test('it returns a 401 with garbage token', async () => {
    const response = await testApp
      .get(`/messages/${msgFromUserToUser2.id}`)
      .send({ _token: 'crap' });
    expect(response.body.error.status).toEqual(401);
    expect(response.body.error.message).toEqual('Unauthorized');
  });
});
