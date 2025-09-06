const asyncErrorHandler = require("./../wrapper_functions/asyncErrorHandler");
const API = require("../classes/Api");
const client = require("../models/Client");
exports.createClient = asyncErrorHandler(async(req,res,next)=>{
    const api = new API(req,res)
    await client.create(req.body)
    api.dataHandler('create')
})
exports.getAllClients = asyncErrorHandler(async(req,res,next)=>{
    const api = new API(req,res)
    api.modify(client.find().lean()).filter().sort().paginate()
    const clients = await api.query
    api.dataHandler('fetch',clients)
})

