var express = require('express');
var router = express.Router();
var Cart = require('../models/cart');
var Product = require('../models/product');
var Order = require('../models/order');
var multer = require('multer');




/* Start GET home page. */
router.get('/', function(req, res, next) {
    var successMsg = req.flash('success')[0];
    Product.find(function(err, docs) {

        var arr2 = [];
        docs.forEach(function(doc) {
            var arr = {};
            arr.items = doc;
            if (req.user){
            if (String(doc.user) == String(req.user._id)){
                arr.att = 1;
            } else {
                arr.att = 0;
            }
        } else {
            arr.att = 0;
        }
        console.log(doc);
            arr2.push(arr);
        });
        console.log(arr2);
        res.render('shop/index', {products: arr2, successMsg: successMsg, noMessage: !successMsg}); // render to the page and send data
    });
});

/* End GET Home Page */

/* Start GET Add To cart Page */
router.get('/addToCart/:id', function(req, res, next) {
    var productId = req.params.id;
    var cart = new Cart(req.session.cart ?req.session.cart : {});

    Product.findById(productId, function(err, product) {
        if (err) {
            return res.redirect('/');
        }
        cart.add(product, product.id);
        req.session.cart = cart;
        console.log(req.session.cart);
        res.redirect('/');
    });
});
/* End GET Add To cart Page */

/* Start GET ShoppingCart page */
router.get('/shoppingCart', function(req, res, next) {
    if (!req.session.cart) {
        return res.render('shop/shoppingCart', {products: null});
    }
    var cart = new Cart(req.session.cart);
    res.render('shop/shoppingCart', {products: cart.genetateArray(), totalPrice: cart.totalPrice});
});
/* End GET ShoppingCart page */

router.get('/reduce/:id', function(req, res, next) {
    var productId = req.params.id;
    var cart = new Cart(req.session.cart ? req.session.cart : {});

    cart.reduceByOne(productId);
    req.session.cart = cart;

    res.redirect('/shoppingCart');
});

router.get('/increment/:id', function(req, res, next) {
    var productId = req.params.id;
    var cart = new Cart(req.session.cart ? req.session.cart : {});

    cart.incByOne(productId);
    req.session.cart = cart;

    res.redirect('/shoppingCart');
});

router.get('/removeItem/:id', function(req, res, next) {
    var productId = req.params.id;
    var cart = new Cart(req.session.cart ? req.session.cart : {});

    cart.removeItem(productId);
    req.session.cart = cart;

    res.redirect('/shoppingCart');
});

/* Start GET checkout page */
router.get('/checkout', isLoggedIn, function(req, res, next) {
    if (!req.session.cart) {
        return res.redirect('/shoppingCart');
    }
    var cart = new Cart(req.session.cart);
    var errMsg = req.flash('error')[0];
    res.render('shop/checkout',{total: cart.totalPrice, totals: cart.totalPrice*100, errMsg: errMsg, noError: !errMsg});
});
/* End GET checkout page */

/* Start POST checkout page */
router.post('/checkout', isLoggedIn, function(req, res, next) {
    if (!req.session.cart) {
        return res.redirect('/shoppingCart');
    }
    var cart = new Cart(req.session.cart);

    // Set your secret key: remember to change this to your live secret key in production
    // See your keys here: https://dashboard.stripe.com/account/apikeys
    var stripe = require("stripe")("sk_test_bQL3unACqC1KhsIlvuXUYwK3");

    // Token is created using Stripe.js or Checkout!
    // Get the payment token ID submitted by the form:
    var token = req.body.stripeToken; // Using Express

    // Charge the user's card:
    stripe.charges.create({
      amount: cart.totalPrice*100,
      currency: "usd",
      description: "Thanks For Charge",
      source: token,
    }, function(err, charge) {
      // asynchronously called
      if (err) {
          req.flash('error', err.message);
          return res.redirect('/checkout');
      }
      var order = new Order({
          user: req.user,
          cart: cart,
          address: req.body.address,
          name: req.body.name,
          paymentId: charge.id
      });
      order.save(function(err, result) {
          if (err) {
              alert('err');
          }
          req.flash('success', 'Successfuly bought items');
          req.session.cart = null;
          res.redirect('/');
      });
    });
});
/* End POST checkout page */

function isLoggedIn(req, res, next) {
    if(req.isAuthenticated()) {
        return next();
    }
    req.session.oldUrl = req.url;
    res.redirect('/user/signin');
}

module.exports = router;
