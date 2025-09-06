const express = require('express');

const { isAuth } = require('../meddlewares');
const checkPermission = require('../meddlewares/checkPermissions');
const { addStorage, getAllStorages } = require('../controller/storageController');

const router = express.Router();

router.post('/',isAuth,checkPermission('Storage','create'),addStorage);
router.get('/',isAuth,checkPermission('Storage','read'),getAllStorages)

module.exports = router;

 