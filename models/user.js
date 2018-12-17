/** User class for message.ly */

const db = require('../db');
const bcrypt = require('bcrypt');
const { BCRYPT_WORK_ROUNDS } = require('../config.js');

/** User of the site. */

class User {
  /** register new user -- returns
   *    {username, password, first_name, last_name, phone}
   */

  static async checkUsernameExists(username) {
    const dbResponse = await db.query(
      `SELECT username from users where username = $1 `,
      [username]
    );
    if (dbResponse.rows.length === 0) {
      const err404 = new Error('not existing!, not found the username');
      err404.status = 404;
      throw err404;
    }
  }

  static async register({ username, password, first_name, last_name, phone }) {
    // Per DB DDL, passwords can be null
    try {
      const hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_ROUNDS);
      await db.query(
        `INSERT INTO users (username, password, first_name, last_name, phone, join_at)
          VALUES ($1, $2, $3, $4, $5, current_timestamp)`,
        [username, hashedPassword, first_name, last_name, phone]
      );
      // Check to see if repeat usernames throw appropriately
      return username;
    } catch (error) {
      throw error;
    }
  }

  /** Authenticate: is this username/password valid? Returns boolean. */

  static async authenticate(username, password) {
    const dbResponse = await db.query(
      `SELECT username, password FROM users
      WHERE username = $1`,
      [username]
    );
    const user = dbResponse.rows[0];
    return bcrypt.compare(password, user.password);
  }

  /** Update last_login_at for user */

  static async updateLoginTimestamp(username) {
    // Further study: update using db timestamp
    try {
      await this.checkUsernameExists(username);
      return await db.query(
        `UPDATE users SET last_login_at=current_timestamp WHERE username=$1`,
        [username]
      );
    } catch (err) {
      throw err;
    }
  }

  /** All: basic info on all users:
   * [{username, first_name, last_name}, ...] */

  static async all() {
    try {
      const dbResponse = await db.query(
        `SELECT username,
              first_name,
              last_name
      FROM users`
      );
      return dbResponse.rows;
    } catch (err) {
      throw err;
    }
  }
  /** Get: get user by username
   *
   * returns {username,
   *          first_name,
   *          last_name,
   *          phone,
   *          join_at,
   *          last_login_at } */

  static async get(username) {
    try {
      await this.checkUsernameExists(username);
      const dbResponse = await db.query(
        `SELECT username,
              first_name,
              last_name,
              phone,
              join_at,
              last_login_at
      FROM users WHERE username=$1`,
        [username]
      );
      return dbResponse.rows[0];
    } catch (err) {
      throw err;
    }
  }

  /** Return messages from this user.
   *
   * [{id, to_user, body, sent_at, read_at}]
   *
   * where to_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesFrom(username) {
    try {
      await this.checkUsernameExists(username);
      const dbResponse = await db.query(
        `SELECT m.id, 
                m.body,
                m.sent_at,
                m.read_at,
                u.username,
                u.first_name,
                u.last_name,
                u.phone
      FROM users AS u
      RIGHT JOIN messages AS m
        ON u.username = m.to_username
      WHERE m.from_username = $1`,
        [username]
      );
      const messages = dbResponse.rows.map(row => {
        const { id, body, sent_at, read_at, ...to_user } = row;
        return { id, to_user, body, sent_at, read_at };
      });
      return messages;
    } catch (err) {
      throw err;
    }
  }

  /** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {id, first_name, last_name, phone}
   */

  static async messagesTo(username) {
    try {
      const dbResponse = await db.query(
        `SELECT m.id,
                m.body,
                m.sent_at,
                m.read_at,
                u.username,
                u.first_name,
                u.last_name,
                u.phone
      FROM users AS u
      RIGHT JOIN messages AS m
        ON u.username = m.from_username
      WHERE m.to_username = $1`,
        [username]
      );
      const messages = dbResponse.rows.map(row => {
        const { id, body, sent_at, read_at, ...from_user } = row;
        return { id, from_user, body, sent_at, read_at };
      });

      return messages;
    } catch (err) {
      throw err;
    }
  }
}
module.exports = User;
