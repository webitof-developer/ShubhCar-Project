const mongoose = require('mongoose');
const Cart = require('./models/Cart.model.ts');
const CartItem = require('./models/CartItem.model.ts');
const cartRepo = require('./modules/cart/cart.repo.ts');
const path = require('path');

// We have to use ts-node to run this script safely with TypeScript components.
console.log('Use ts-node directly to execute this if necessary.');
