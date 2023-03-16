const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

const pool = require('../database');
const helpers = require('../lib/helpers');
const heplers = require('../lib/helpers');

passport.use('local.signin', new LocalStrategy({
    usernameField: 'username',
    passwordField: 'password',
    passReqToCallback: true
}, async (req, username, password, done) => {
    
    const rows = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
    if( rows.length > 0 ) {
      const user = rows[0];
      const validPassword = await helpers.matchPassword(password, user.password);
      if( validPassword ) {
        done(null, user, req.flash('success', 'Welcome' + user.username));
      }else {
        done(null, false, req.flash('message', 'Incorrect Password'));
      }
    }else {
      return done(null, false, req.flash('message', 'The username does not exist'));
    }
}));

passport.use(
  'local.signup', 
  new LocalStrategy(
    {
      usernameField: "username",
      passwordField: "password",
      passReqToCallback: true
    },
    async (req, username, password, done) => {
      const { fullname } = req.body;
      const newUser = {
        username,
        password,
        fullname,
      };
      newUser.password = await heplers.encryptPassword(password);
      const result = await pool.query('INSERT INTO users SET ?', [newUser]); 
      newUser.id = result.insertId;
      return done( null, newUser ); //saving a session for a user
    }
  )
);

passport.serializeUser( (user, done) => {  //saving the user id "first time"
    done(null, user.id);
});

passport.deserializeUser( async (id, done) => {  //taking user id saved to show their results
    const rows = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
    done( null, rows[0] );
}); 
