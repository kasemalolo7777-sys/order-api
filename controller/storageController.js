const API = require("../classes/Api");
const storage = require("../models/Storage");
const asyncErrorHandler = require("../wrapper_functions/asyncErrorHandler");

const getAllStorages = asyncErrorHandler(async(req,res,next)=>{
    const api = new API(req,res)
     api.modify(storage.find().lean()).filter().sort().paginate()
    const storages = await api.query
    api.dataHandler('fetch',storages)
})
const addStorage =  asyncErrorHandler(async(req,res,next)=>{
    const api = new API(req,res)
    await storage.create(req.body)
    api.dataHandler('create')
})
module.exports = {
    getAllStorages,
    addStorage
}