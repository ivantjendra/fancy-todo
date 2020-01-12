const User = require('../models/user');
const {OAuth2Client} = require('google-auth-library');
const client = new OAuth2Client(process.env.CLIENT_ID);
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

class UserController {
  static register(req, res, next) {
    const {name, email, password} = req.body;
    User.findOne({
      email
    })
      .then(user => {
        if(!user) {
          const salt = bcrypt.genSaltSync(10);
          const hash = bcrypt.hashSync(password, salt);
          password = hash
          return User.create({
            name,
            email,
            password
          })
        } else {
          return User.update({
            _id: user._id
          }, {
            name,
            password
          })
        }
      })
     .then(user => {
       const userName = user.name;
       res.status(201).json({userName})
     })
     .catch(next)
  }

  static findUser(req, res, next) {
    User.findOne({_id: req.body.userId}).populate('todoIds')
      .then(user => {
        console.log(user)
      })
      .catch(next)
  }

  static login(req, res, next) {
    const {email, password} = req.body;
    User.findOne({
      email
    })
      .then(user => {
        const verified = bcrypt.compareSync(password, user.password);
        if(verified) {
          const token = jwt.sign({_id: user._id}, process.env.SECRET);
          res.status(200).json({token})
        } else {
          res.status(401).json({msg: 'unauthorized'})
        }
      })
      .catch(next)
  }

  static googleLogin(req, res, next) {
    let ticketPayload
    client.verifyIdToken({
      idToken: req.body.google_token,
      audience: process.env.CLIENT_ID
    })
      .then(ticket => {
        ticketPayload = ticket.getPayload();
        return User.findOne({
          email: ticketPayload.email
        })
      })
      .then(user => {
        if(!user) {
          return User.create({
            name: ticketPayload.name,
            google_sign: true,
            email: ticketPayload.email
          })
        } else {
          return user
        }
      })
      .then(user => {
        const token = jwt.sign({_id : user._id}, process.env.SECRET);
        res.status(201).json({token})
      })
      .catch(next)
  }

  static logout(req, res, next) {

  }
}

module.exports = UserController;