const API = require("../classes/Api");
const Role = require("../models/Role");
const InviteCode = require('../models/InviteCode')
const { formatDates } = require("../utils");
const asyncErrorHandler = require("../wrapper_functions/asyncErrorHandler");

exports.createRole =asyncErrorHandler( async (req, res,next) => {
   const api = new API(req, res);
    const { name, status, fieldsNames, permissions } = req.body;

    const existingRole = await Role.findOne({ name });
    if (existingRole) {
        const error  = api.errorHandler('invalid','Role name already exists')
      next(error)
    }

    const newRole = new Role({
      name,
      status,
      fieldsPermissions:fieldsNames,
      sectionPermissions:permissions
    });

    const savedRole = await newRole.save();
    api.dataHandler('create',savedRole)
 
})
exports.getAllRoles =asyncErrorHandler(async(req,res,next)=>{
       const api = new API(req,res)
  api.modify(Role.aggregate([
      {
        $lookup: {
          from: 'users', // collection name (should match MongoDB collection)
          localField: '_id',
          foreignField: 'roleId',
          as: 'users'
        }
      },
      {
        $addFields: {
          userCount: { $size: '$users' }
        }
      },
      {
        $project: {
          name: 1,
          status: 1,
          createdAt: 1,
          userCount: 1
        }
      }
    ])).filter().sort().paginate()
  const Roles = await api.query
  const totalPages = await Role.countDocuments()
   api.dataHandler('fetch',{
      Roles:formatDates(Roles),
      totalPages,
    })
})
exports.getAllRolesNames =asyncErrorHandler(async(req,res,next)=>{
       const api = new API(req,res)
  api.modify(Role.find()).filter().sort().paginate().limitFields(['name','_id'])
  const Roles = await api.query
   api.dataHandler('fetch',Roles)
})
exports.getRoleById = asyncErrorHandler(async(req,res,next)=>{
       const api = new API(req,res)
  api.modify(Role.findById(req.params.id).lean()).filter().sort().limitFields()
  const Roles = await api.query
  const totalPages = await Role.countDocuments()
   api.dataHandler('fetch',{
      Roles:formatDates(Roles)[0],
      totalPages,
    })
})


// Edit a role
exports.editRole =asyncErrorHandler( async (req, res,next) => {
     const api = new API(req,res)
    const { id } = req.params;
    console.log(req.body);
    
    const { name, status, fieldsNames, permissions } = req.body;

    const updatedRole = await Role.findByIdAndUpdate(
      req.params.id,
      {$set:{
        name,
        status,
        fieldsPermissions:fieldsNames,
        sectionPermissions:permissions
      },}
      
    );

    if (!updatedRole) {
        const error = api.errorHandler('not_found','Role not found')
        next(error)
    }

    res.json(updatedRole);
  
})

// Delete a role
exports.deleteRole = asyncErrorHandler(async (req, res,next) => {
    const api = new API(req,res)
    const { id } = req.params;

    const deletedRole = await Role.findByIdAndDelete(id);

    if (!deletedRole) {
        const error = api.errorHandler('not_found','Role not found' )
       next(error)
    }
    api.dataHandler('delete')
  
})
exports.createInviteCode = asyncErrorHandler(async (req,res,next)=>{
const api =new API(req,res)
const {roleId,code} = req.body
if(!roleId || !code){
  const error = api.errorHandler('uncomplated_data')
  next(error)
}
const newInviteCode = new InviteCode({
  role:roleId,
  code
})
 await newInviteCode.save()
 api.dataHandler('create','invite code created and activated correctly ')
})
