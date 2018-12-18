const express = require('express');
const router = new express.Router();
router.use(express.json());
const { ensureLoggedIn, ensureCorrectUser } = require('../middleware/auth');

const jwt = require('jsonwebtoken');
const { SECRET_KEY, BCRYPT_WORK_ROUNDS } = require('../config.js');
const User = require('../models/user');

/** GET / - get list of users.
 *
 * => {users: [{username, first_name, last_name, phone}, ...]}
 *
 **/

router.get('/', ensureLoggedIn, async function getAll(req, res, next) {
  return res.json(await User.all());
});

/** GET /:username - get detail of users.
 *
 * => {user: {username, first_name, last_name, phone, join_at, last_login_at}}
 *
 **/

router.get(
  '/:username',
  ensureLoggedIn,
  ensureCorrectUser,
  async function getDetails(req, res, next) {
    return res.json(await User.get(req.username));
  }
);

/** GET /:username/to - get messages to user
 *
 * => {messages: [{id,
 *                 body,
 *                 sent_at,
 *                 read_at,
 *                 from_user: {username, first_name, last_name, phone}}, ...]}
 *
 **/

router.get(
  '/:username/to',
  ensureLoggedIn,
  ensureCorrectUser,
  async function getToMsgs(req, res, next) {
    const getToMsgs = await User.messagesTo(req.username);
    return res.json(getToMsgs);
  }
);

/** GET /:username/from - get messages from user
 *
 * => {messages: [{id,
 *                 body,
 *                 sent_at,
 *                 read_at,
 *                 to_user: {username, first_name, last_name, phone}}, ...]}
 *
 **/
router.get(
  '/:username/from',
  ensureLoggedIn,
  ensureCorrectUser,
  async function getFromMsgs(req, res, next) {
    const getFromMsgs = await User.messagesFrom(req.username);
    return res.json(getFromMsgs);
  }
);

module.exports = router;
