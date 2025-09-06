const API = require("../classes/Api")
const Material = require("../models/Material")
const asyncErrorHandler = require("../wrapper_functions/asyncErrorHandler")

exports.getAllMaterial = asyncErrorHandler(async(req,res,next)=>{
    const api = new API(req,res)
    const {material} = req.query
    api.modify(Material.find().lean()).filter(["materialResourceType","materialType"],["width","length",'gramage']).limitFields([material,'storage']).sort().paginate()
    const gramageList = await api.query
    api.dataHandler('fetch',gramageList)
})
exports.getAllMaterialTable = asyncErrorHandler(async(req,res,next)=>{
       const api = new API(req,res)
      console.log(req.query);
      
   
  api.modify(Material.find()).filter(["materialResourceType","materialType"],["width","length",'gramage']).sort().limitFields().paginate()
  const materials = await api.query
  const totalPages = await Material.countDocuments()
   api.dataHandler('fetch',{
      materials:materials,
      totalPages,
    })
})
exports.insertManyMaterial = asyncErrorHandler(async(req,res,next)=>{
    const api = new API(req, res);
    const ops = [
  { deleteMany: { filter: {} } }, // Delete all docs
  ...req.body.data.map(doc => ({
    insertOne: { document: doc }
  }))
];

const result = await Material.bulkWrite(ops);

    api.dataHandler('create')
})