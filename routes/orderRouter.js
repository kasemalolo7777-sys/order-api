const express = require('express');
const {createOrder, getAllOrders, getOrderById, editOrder, changeOrderStage, cancelOrder, getOrderHistory} =require('../controller/orderController')
const { isAuth, restrict } = require('../meddlewares');
const checkPermission = require('../meddlewares/checkPermissions');

const router = express.Router();

router.post('/',isAuth,checkPermission('Orders','create'),createOrder);
router.get('/',isAuth,checkPermission('Orders','read'), getAllOrders)
router.get('/history/:id',isAuth,checkPermission('Orders','read'),getOrderHistory)
router.get('/:id',isAuth,checkPermission('Orders','read'),getOrderById)
router.put('/stage/:id',isAuth,checkPermission('Orders','edit'),changeOrderStage)
router.put('/:id',isAuth,checkPermission('Orders','edit'),editOrder);
router.delete('/:id',isAuth,checkPermission('Orders','delete'),cancelOrder)


module.exports = router;

