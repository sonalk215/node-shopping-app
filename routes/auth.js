const express = require('express');
const {check, body} = require('express-validator');
const User = require('../models/user');

const router = express.Router();

const authController = require('../controllers/auth');

router.get('/login', authController.getLogin);

router.post('/login', [
  body('email')
    .isEmail()
    .withMessage('Please enter a valid email')
    .normalizeEmail(),
  body('password', 'Password has to be valid')
    .isLength({min: 3})
    .isAlphanumeric()
    .trim(),
], authController.postLogin)

router.post('/logout', authController.postLogout);

router.get('/signup', authController.getSignup);

router.post('/signup',
  [
    check('email')
      .isEmail()
      .withMessage('Please enter a valid email')
      .custom((value, {req})=> {
        console.log('----', value);
        return User.findOne({email: value})
        .then(userDoc=> {
          if (userDoc) {
            return Promise.reject('Email exists already, please pick a different one.');
          }
        })
      })
      .normalizeEmail(),
    body('password', 'Please enter a valid pasword, atleast 3 characters')
      .trim()
      .isLength({min: 3})
      .isAlphanumeric(),
    body('confirmPassword')
      .trim()
      .custom((value, {req}) => {
        if(value!==req.body.password) {
          throw new Error('Passwords have to match');
        }
        return true;
      })
      
  ],
  authController.postSignup);

router.get('/reset', authController.getReset);

router.post('/reset', authController.postReset);

router.get('/reset/:token', authController.getNewPassword);

router.post('/new-password', authController.postNewPassword);

module.exports = router;