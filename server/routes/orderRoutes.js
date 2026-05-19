const express = require('express');
const router = express.Router();
const Order = require('../models/orderModel');
const orderCtrls = require('../controllers/orderCtrls');
const { optionalVerifyToken, verifyToken } = require('../utils/helper');
const adminOnly = require('../middlewares/adminOnly');
const { checkoutLimiter, writeLimiter } = require('../middlewares/rateLimiter');
// check out
router.post('/checkout-session', checkoutLimiter, verifyToken, orderCtrls.createCheckoutSession);
router.post('/confirm-payment', checkoutLimiter, optionalVerifyToken, orderCtrls.confirmPayment);

// get orders by user id
router.get('/order/:id', verifyToken, orderCtrls.getOrdersById);

// get all orders
router.get('/', verifyToken,adminOnly, orderCtrls.getAllOrders);

//get order by email address
router.get('/:email', verifyToken, orderCtrls.getOrdersByEmail);  

//update order status
router.patch('/update-order-status/:id', writeLimiter, verifyToken,adminOnly,orderCtrls.updateOrderStatus);

//delete order
router.delete('/delete/:id', writeLimiter, verifyToken,adminOnly, orderCtrls.deleteOrder);
module.exports = router;
