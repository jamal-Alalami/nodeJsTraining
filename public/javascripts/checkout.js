var stripe = Stripe('sk_test_bQL3unACqC1KhsIlvuXUYwK3');
var elements = stripe.elements();

var card = elements.create('card');
card.mount('#card-element');

var promise = stripe.createToken(card);
promise.then(function(result) {
  // result.token is the card token.
});
