const express = require('express');
const router = new express.Router();
router.use(express.json());
const { ensureLoggedIn, ensureCorrectUser } = require('../middleware/auth');

const jwt = require('jsonwebtoken');
const { SECRET_KEY, BCRYPT_WORK_ROUNDS } = require('../config.js');
const Message = require('../models/message');

async function getMsg(req, res, next) {
  req.msg = await Message.get(req.params.id);
  return next();
}

function checkMsgFrom(req) {
  return req.username === req.msg.from_user.username;
}
function checkMsgTo(req) {
  return req.username === req.msg.to_user.username;
}
/** GET /:id - get detail of message.
 *
 * => {message: {id,
 *               body,
 *               sent_at,
 *               read_at,
 *               from_user: {username, first_name, last_name, phone},
 *               to_user: {username, first_name, last_name, phone}}
 *
 * Make sure that the currently-logged-in users is either the to or from user.
 *
 **/

router.get('/:id', ensureLoggedIn, getMsg, async function viewMsg(
  req,
  res,
  next
) {
  if (checkMsgFrom(req) || checkMsgTo(req)) {
    return res.json(req.msg);
  } else {
    return next({ status: 401, message: 'Unauthorized' });
  }
});

/** POST / - post message.
 *
 * {to_username, body} =>
 *   {message: {id, from_username, to_username, body, sent_at}}
 *
 **/

router.post('/', ensureLoggedIn, async function postMsg(req, res, next) {
  try {
    const message = await Message.create({
      from_username: req.username,
      to_username: req.body.to_username,
      body: req.body.body
    });
    return res.json({ message });
  } catch (error) {
    next(error);
  }
});

/** POST/:id/read - mark message as read:
 *
 *  => {message: {id, read_at}}
 *
 * Make sure that the only the intended recipient can mark as read.
 *
 **/

router.post('/:id/read', ensureLoggedIn, getMsg, async function readMsg(
  req,
  res,
  next
) {
  if (checkMsgTo(req)) {
    const message = await Message.markRead(req.params.id);
    return res.json({ message });
  } else {
    return next({ status: 401, message: 'Unauthorized' });
  }
});

module.exports = router;
