var passport = require('passport');
var User = require('../models/user');
var LocalStrategy = require('passport-local').Strategy;

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
        done(err, user);
    });
});

passport.use('local.signup', new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true
}, function(req, email, password, done) {
    req.checkBody('username', 'Username Can\'t Be Empty Or Less Than 4 Characters.').notEmpty().isLength({min:4});
    req.checkBody('email', 'Invalid Email').notEmpty().isEmail();
    req.checkBody('password', 'Invalid Password').notEmpty().isLength({min:4}).equals(req.body.confirmPassword);
    var errors = req.validationErrors();
    if (errors) {
        var messages = [];
        errors.forEach(function(error) {
            messages.push(error.msg);
        });
        return done(null, false, req.flash('error', messages));
    }

    User.findOne({'email': email}, function(err, user) {
        if (err) {
            return done(err);
        }
        if (user) {
            return done(null, false, {message: 'E-mail is already in use.'});
        }
        User.findOne({'username': req.body.username}, function(error, user) {
            if (err) {
                return done(err);
            }
            if (user) {
                return done(null, false, {message: 'username is already in use.'});
            }
        });
        var img ='default.jpg';
        if (req.file) {
            img= req.file.originalname;
        }
        var newUser = new User();
        newUser.username = req.body.username;
        newUser.email = email;
        newUser.password = newUser.encryptPassword(password);
        newUser.confirmPassword = newUser.encryptPassword(password);
        newUser.imagePath = img;
        newUser.save(function(err, result) {
            if (err) {
                return done(err);
            }
            return done(null, newUser);
        });
    });
}));


passport.use('local.signin', new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true
},function(req, email, password, done){
    //req.checkBody('username', 'Username Can\'t Be Empty Or Less Than 4 Characters.').notEmpty().isLength({min:4});
    req.checkBody('email', 'Invalid Email').notEmpty().isEmail();
    req.checkBody('password', 'Invalid Password').notEmpty();
    var errors = req.validationErrors();
    if (errors) {
        var messages = [];
        errors.forEach(function(error) {
            messages.push(error.msg);
        });
        return done(null, false, req.flash('error', messages));
    }

    User.findOne({'email': email}, function(err, user) {
        if (err) {
            return done(err);
        }
        if (!user) {
            return done(null, false, {message: 'No User Found.'});
        }
        if (!user.validPassword(password)) {
            return done(null, false, {message: 'Wrong Password.'});
        }

        return done(null, user);
        });
    }));
