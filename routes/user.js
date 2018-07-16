var express = require('express');
var router = express.Router();
var csrf = require('csurf'); // module to mange stealing sessions
var passport = require('passport');
var Order = require('../models/order');
var Cart = require('../models/cart');
var User = require('../models/user');
var Product = require('../models/product');
var multer = require('multer');

var csrfProtection = csrf();
router.use(csrfProtection); // all of the router here should use csrf protection

/* we use it when create adithional router require sessions
** to import sessions we need two steps
** npm install --save express-session then import in app.js file
*/

/* Start add item */
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  }
});

var upload = multer({ storage: storage });

router.post('/addItem', upload.single('myImage') ,function (req, res, next) {

      var product = new Product({
          user: req.user,
          imagePath: req.file.originalname,
          title: req.body.title,
          description: req.body.description,
          price: req.body.price
      });
      product.save(function(err, result) {
          if (err) {
              alert('err');
          }
          res.redirect('/user/items');
      });
      // Everything went fine
});

router.get('/addItem', isLoggedIn, function(req, res, next) {
    res.render('user/addItem',{csrfToken: req.csrfToken()});

});
/* end add item */

router.get('/removeItems/:id', isLoggedIn, function(req, res, next) {
    var productId = req.params.id;
    Product.remove({ $and: [{ _id: productId },{user: req.user}]}, function (err) {
  if (err) return handleError(err);
  // removed!
  res.redirect('/user/items');
});
});


router.get('/editItems/:id', isLoggedIn, function(req, res, next) {
    var productId = req.params.id;
    Product.find({ $and: [{ _id: productId },{user: req.user}]}, function (err, docs) {
  if (err) return handleError(err);
  // removed!
  res.render('user/editItem',{csrfToken: req.csrfToken(),item: docs});
});
});

router.post('/editItems', upload.single('myImage') ,function (req, res, next) {
        var img = req.body.oldImg;
        if (req.file) {
            img = req.file.originalname;
        }
        var productId = req.body.id;
        console.log(productId, req.user);
      Product.update({ _id: productId ,user: req.user},
          {$set:{
              title: req.body.title,
              description: req.body.description,
              price: req.body.price,
              imagePath: img
      }},function(err, result) {
          if (err) {
              return res.write('Error!');
          }
          res.redirect('/user/items');
      });
      // Everything went fine
});

router.get('/profile/:id', isLoggedIn, function(req, res, next) {
    var userId = req.user._id;
    User.find({ $and: [{_id: req.user}]}, function (err, docs) {
  if (err) return handleError(err);
  // removed!
  res.render('user/profile', {csrfToken: req.csrfToken(),user: docs});
});
});

router.post('/profile', upload.single('myImage') ,function (req, res, next) {
        var img = req.body.oldImg;
        if (req.file) {
            img = req.file.originalname;
        }
        var productId = req.body.id;
        console.log(productId, req.user);
      Product.update({ _id: productId ,user: req.user},
          {$set:{
              title: req.body.title,
              description: req.body.description,
              price: req.body.price,
              imagePath: img
      }},function(err, result) {
          if (err) {
              return res.write('Error!');
          }
          res.redirect('/user/items');
      });

});



router.get('/items',isLoggedIn, function(req, res, next) {
    Product.find({user: req.user}, function(err, items) {
        if (err) {
            return res.write('Error!');
        }

        res.render('user/items', {items: items });
    });
});
/* Start GET profile page */
router.get('/order', isLoggedIn, function(req, res, next) {
    Order.find({user: req.user}, function(err, orders) {
        if (err) {
            return res.write('Error!');
        }
        var cart;
        orders.forEach(function(order) {
            cart = new Cart(order.cart);
            order.items = cart.genetateArray();

        });
        console.log(orders);
        res.render('user/order', {products: orders });
    });
});
/* End GET profile page */

/* Start GET Logout page */
router.get('/logout', isLoggedIn, function(req, res, next) {
    req.logout();
    req.session.user = null;
    res.redirect('/');
});
/* End GET Logout page */

router.use('/', notLoggedIn, function(req, res, next) {
    next();
});


/* Start Get SignUp page */
router.get('/signup', function(req, res, next) {
    var messages = req.flash('error');
    res.render('user/signup', {csrfToken: req.csrfToken(), messages: messages, hasErrors: messages.length > 0});
});
/* End Get SignUp page */

/* Start POST Signup page */
router.post('/signup', upload.single('myImage'), passport.authenticate('local.signup', {
    failureRedirect: '/user/signup',
    failureFlash: true
}), function(req, res, next) {
    req.session.user = req.user;
    if (req.session.oldUrl) {
        var oldUrl = req.session.oldUrl
        req.session.oldUrl = null;
        res.redirect(oldUrl);
    } else {
        res.redirect('user/profile');
    }
});
/* End POST Signup page */

/* Start GET SignIn page */
router.get('/signin', function(req, res, next) {

    var messages = req.flash('error');
    res.render('user/signin', {csrfToken: req.csrfToken(), messages: messages, hasErrors: messages.length > 0});
});
/* End GET SignIn page */

/* Start POST SignIn page */
router.post('/signin', passport.authenticate('local.signin', {
    failureRedirect: '/user/signin',
    failureFlash: true
}), function(req, res, next) {

    req.session.user = req.user;
    console.log(req.session.user);
    if (req.session.oldUrl) {
        var oldUrl = req.session.oldUrl
        req.session.oldUrl = null;
        res.redirect(oldUrl);
    } else {
        res.redirect('user/profile');
    }
});
/* End POST SignIn page */


module.exports = router;

function isLoggedIn(req, res, next) {
    if(req.isAuthenticated()) {
        return next();
    }
    res.redirect('/');
}

function notLoggedIn(req, res, next) {
    if(!req.isAuthenticated()) {
        return next();
    }
    res.redirect('/');
}
