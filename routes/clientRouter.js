const express = require('express');

const { isAuth } = require('../meddlewares');
const checkPermission = require('../meddlewares/checkPermissions');
const { createClient, getAllClients } = require('../controller/clientController');


const router = express.Router();

router.post('/',isAuth,checkPermission('Client','create'),createClient);
router.get('/',isAuth,checkPermission('Client','read'),getAllClients)

module.exports = router;

 