const express = require('express');
const router = express.Router();
const orderCtrls = require('../controllers/orderCtrls');
const { optionalVerifyToken, verifyToken } = require('../utils/helper');
const adminOnly = require('../middlewares/adminOnly');
const { checkoutLimiter, writeLimiter } = require('../middlewares/rateLimiter');

// check out
router.post('/checkout-session', checkoutLimiter, verifyToken, orderCtrls.createCheckoutSession);
router.post('/confirm-payment', checkoutLimiter, optionalVerifyToken, orderCtrls.confirmPayment);

// get the signed-in user's own orders (email comes from the token, not the URL)
router.get('/mine', verifyToken, orderCtrls.getMyOrders);

// get order by id
router.get('/order/:id', verifyToken, orderCtrls.getOrdersById);

// get all orders (admin, paginated + filterable)
router.get('/', verifyToken, adminOnly, orderCtrls.getAllOrders);

//update order status
router.patch('/update-order-status/:id', writeLimiter, verifyToken, adminOnly, orderCtrls.updateOrderStatus);

//delete order
router.delete('/delete/:id', writeLimiter, verifyToken, adminOnly, orderCtrls.deleteOrder);

module.exports = router;
