// middlewares/checkPermission.js
const API = require('../classes/Api');
const Role = require('../models/Role');
const asyncErrorHandler = require('../wrapper_functions/asyncErrorHandler');

/**
 * Middleware to check permission on a section and action.
 * Usage: checkPermission('products', 'edit')
 */
const checkPermission = (sectionName, actionType) => {
  return asyncErrorHandler( async (req, res, next) => {
      const api = new API(req,res)
      const user = req.user; // assuming req.user is already populated (via auth middleware)
       console.log(user);
       
      if (!user || (!user.roleId && !user.isAdmin)) {
        const error = api.errorHandler('Forbidden')
        next(error)
        
      }

      // Super admin override
      if (user.isAdmin) {
        return next();
      }

      // Get role and permissions
      const role = await Role.findById(user.roleId).lean();
      if (!role) {
          const error = api.errorHandler('Forbidden','Role not found.')
        next(error)
       
      }

      // Find section permission by section name
      const section = role.sectionPermissions.find(sec => sec.section === sectionName);

      if (!section || !section[actionType]) {
          const error = api.errorHandler('Forbidden',`Permission denied for ${actionType} on ${sectionName}.`)
        next(error)
      }
     req.role = role
      next();
    
  })
};

module.exports = checkPermission;
