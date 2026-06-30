'use strict';

const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const UserModel = require('../models/userModel');

const AuthController = {
  showLogin(req, res) {
    res.render('auth/login', { title: 'Sign in', values: {} });
  },

  showRegister(req, res) {
    res.render('auth/register', { title: 'Create account', values: {}, errors: [] });
  },

  async register(req, res, next) {
    try {
      const errors = validationResult(req);
      const { full_name, email, password } = req.body;

      if (!errors.isEmpty()) {
        return res.status(422).render('auth/register', {
          title: 'Create account',
          values: { full_name, email },
          errors: errors.array(),
        });
      }

      const existing = await UserModel.findByEmail(email.toLowerCase());
      if (existing) {
        return res.status(409).render('auth/register', {
          title: 'Create account',
          values: { full_name, email },
          errors: [{ msg: 'That email is already registered.' }],
        });
      }

      // The very first account to register becomes the admin.
      const isFirstUser = (await UserModel.count()) === 0;
      const password_hash = await bcrypt.hash(password, 12);
      const user = await UserModel.create({
        full_name,
        email: email.toLowerCase(),
        password_hash,
        role: isFirstUser ? 'admin' : 'scheduler',
      });

      req.session.user = {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
      };
      req.flash('success', `Welcome aboard, ${user.full_name.split(' ')[0]}.`);
      return res.redirect('/dashboard');
    } catch (err) {
      return next(err);
    }
  },

  async login(req, res, next) {
    try {
      const errors = validationResult(req);
      const { email, password } = req.body;

      if (!errors.isEmpty()) {
        req.flash('error', errors.array()[0].msg);
        return res.status(422).render('auth/login', {
          title: 'Sign in',
          values: { email },
        });
      }

      const user = await UserModel.findByEmail(email.toLowerCase());
      const ok = user && (await bcrypt.compare(password, user.password_hash));
      if (!ok) {
        req.flash('error', 'Incorrect email or password.');
        return res.status(401).render('auth/login', {
          title: 'Sign in',
          values: { email },
        });
      }

      req.session.user = {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
      };

      const dest = req.session.returnTo || '/dashboard';
      delete req.session.returnTo;
      req.flash('success', `Welcome back, ${user.full_name.split(' ')[0]}.`);
      return res.redirect(dest);
    } catch (err) {
      return next(err);
    }
  },

  logout(req, res) {
    req.session.destroy(() => {
      res.clearCookie('connect.sid');
      res.redirect('/auth/login');
    });
  },
};

module.exports = AuthController;
