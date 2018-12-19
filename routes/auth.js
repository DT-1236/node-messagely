const express = require('express');
const router = new express.Router();
router.use(express.json());

const jwt = require('jsonwebtoken');
const { SECRET_KEY } = require('../config.js');
const User = require('../models/user');
// const { ensureLoggedIn, ensureCorrectUser } = require('../middleware/auth');

/** POST /login - login: {username, password} => {token}
 *
 * Make sure to update their last-login!
 *
 **/

router.post('/login', async function login(req, res, next) {
  try {
    const { username, password } = req.body;
    if (await User.authenticate(username, password)) {
      const token = jwt.sign({ username }, SECRET_KEY);
      await User.updateLoginTimestamp(username);
      return res.json({ token });
    } else {
      const err = new Error('not valid username/pw');
      err.status = 401;
      throw err;
    }
  } catch (err) {
    next(err);
  }
});

/** POST /register - register user: registers, logs in, and returns token.
 *
 * {username, password, first_name, last_name, phone} => {token}.
 *
 *  Make sure to update their last-login!
 */

router.post('/register', async function register(req, res, next) {
  try {
    const { username, password, first_name, last_name, phone } = req.body;

    await User.register({
      username,
      password,
      first_name,
      last_name,
      phone
    });
    const token = jwt.sign({ username }, SECRET_KEY); //jwt is sync
    return res.json({ token });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
