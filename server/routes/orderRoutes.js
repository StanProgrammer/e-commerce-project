const express = require('express');
const router = express.Router();
const orderCtrls = require('../controllers/orderCtrls');
const { optionalVerifyToken, verifyToken } = require('../utils/helper');
const adminOnly = require('../middlewares/adminOnly');
const { checkoutLimiter, writeLimiter } = require('../middlewares/rateLimiter');

// Checkout
router.post('/checkout-session', checkoutLimiter, verifyToken, orderCtrls.createCheckoutSession);
router.post('/confirm-payment', checkoutLimiter, optionalVerifyToken, orderCtrls.confirmPayment);

// get the signed-in user's own orders (email comes from the token, not the URL)
router.get('/mine', verifyToken, orderCtrls.getMyOrders);

// Get order by id
router.get('/order/:id', verifyToken, orderCtrls.getOrdersById);

// Get all orders (admin, paginated)
router.get('/', verifyToken, adminOnly, orderCtrls.getAllOrders);

// Update order status
router.patch('/update-order-status/:id', writeLimiter, verifyToken, adminOnly, orderCtrls.updateOrderStatus);

// Delete order
router.delete('/delete/:id', writeLimiter, verifyToken, adminOnly, orderCtrls.deleteOrder);

module.exports = router;
