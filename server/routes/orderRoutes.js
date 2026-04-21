const express = require('express');
const router = express.Router();
const Order = require('../models/orderModel');
const orderCtrls = require('../controllers/orderCtrls');
const { verifyToken } = require('../utils/helper');
const adminOnly = require('../middlewares/adminOnly');
// check out
router.post('/checkout-session', verifyToken, orderCtrls.createCheckoutSession);
router.post('/confirm-payment', verifyToken, orderCtrls.confirmPayment);

//get order by email address
router.get('/:email', verifyToken, orderCtrls.getOrdersByEmail);  

// get orders by user id
router.get('/order/:id', verifyToken, orderCtrls.getOrdersById);

// get all orders
router.get('/', verifyToken,adminOnly, orderCtrls.getAllOrders);

//update order status
router.patch('/update-order-status/:id', verifyToken,adminOnly,orderCtrls.updateOrderStatus);

//delete order
router.delete('/delete/:id', verifyToken,adminOnly, orderCtrls.deleteOrder);
module.exports = router;