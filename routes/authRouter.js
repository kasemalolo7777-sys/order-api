const express = require('express');
const authController = require('./../controller/authController');
const { isAuth, restrict } = require('../meddlewares');
const checkPermission = require('../meddlewares/checkPermissions');


const router = express.Router();

router.post('/signup',authController.signup);
router.post('/login',authController.login)
router.post('/token',authController.token)
router.get('/logout',isAuth,authController.logout)
router.get('/myprofile',authController.getUserById)
router.get('/allUsers',isAuth,checkPermission('Users','read'), authController.getAllEmployee)
router.post('/employee',isAuth,checkPermission('Users','create'),authController.createEmployee)
module.exports = router;