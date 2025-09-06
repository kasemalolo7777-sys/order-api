const express = require('express');

const { isAuth } = require('../meddlewares');
const checkPermission = require('../meddlewares/checkPermissions');
const { insertManyMaterial, getAllMaterial, getAllMaterialTable } = require('../controller/materialController');


const router = express.Router();

router.post('/',isAuth,checkPermission('Material','create'),insertManyMaterial);
router.get('/',isAuth,checkPermission('Material','read'),getAllMaterialTable)
router.get('/materialType',getAllMaterial)

module.exports = router;

 