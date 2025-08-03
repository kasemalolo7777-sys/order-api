const express = require('express');
const { createRole, getAllRoles, getRoleById, createInviteCode, editRole } = require('../controller/rolesController');
const { isAuth } = require('../meddlewares');
const checkPermission = require('../meddlewares/checkPermissions');

const router = express.Router();

router.post('/',isAuth,checkPermission('Roles','create'),createRole);
router.get('/',isAuth,checkPermission('Roles','read'),getAllRoles)
router.get('/:id',isAuth,checkPermission('Roles','read'),getRoleById)
router.post('/code',isAuth,checkPermission('Roles','create'),createInviteCode)
router.put('/:api',isAuth,checkPermission('Roles','edit'),editRole)
module.exports = router;

 