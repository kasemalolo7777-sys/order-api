const API = require("../classes/Api");
const Order = require("../models/Order");
const OrderHistory = require("../models/OrderHistory");
const User = require("../models/User");
const { formatDates } = require("../utils");
const asyncErrorHandler = require("./../wrapper_functions/asyncErrorHandler");
const dotenv = require("dotenv");
dotenv.config({path: '../config.env'});



exports.createOrder = asyncErrorHandler(async (req,res,next)=>{
      const api = new API(req, res);
      const newOrder = await Order.create({
        ...req.body,
        createdBy:req.user._id
      })
      await OrderHistory.create({
        orderId:newOrder._id,
        name:req.user?.userName,
        date:new Date().toLocaleString("en-US",{
          day:'numeric',
          month:"short",
          year:'numeric'
        }),
        logs:[{
          msg:`order has been created by ${req.user.userName}`
        }]
      }) 
      

      api.dataHandler("create", { data:formatDates(newOrder) });
})
exports.getAllOrders = asyncErrorHandler(async(req,res,next)=>{
       const api = new API(req,res)
       let allowedFields =[] 
       if(req?.role?.fieldsPermissions){
        allowedFields = [...req?.role?.fieldsPermissions,"createdAt",'stage','status']
       }

  api.modify(Order.find().populate({
        path: 'createdBy',
        select: 'userName  -_id' // Only get the role name
      }).lean()).filter([],['price','orderNumber']).sort().limitFields(allowedFields).paginate()
  const orders = await api.query
  const totalPages = await Order.countDocuments()
   api.dataHandler('fetch',{
      orders:formatDates(orders),
      totalPages,
    })
})
exports.getAllOrdersBetweenDate = asyncErrorHandler(async (req, res, next) => {
  const { startDate, endDate, dateField = "orderDate" } = req.query;

  const allowedFields = ["orderDate", "deliveryDate", "invoiceDate", "createdAt"];

  if (!startDate || !endDate) {
      const error = api.errorHandler('uncomplated_data',"startDate and endDate query parameters are required")
      next(error)
   
  }

  if (!allowedFields.includes(dateField)) {
      const error = api.errorHandler('uncomplated_data',`Invalid dateField. Allowed fields are: ${allowedFields.join(", ")}`)
      next(error)
   
  }

  const filter = {
    [dateField]: {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    },
  };

  const api = new API(req, res);
  api.modify(Order.find(filter).lean()).filter().sort().limitFields().paginate();

  const orders = await api.query;
  const totalPages = await Order.countDocuments(filter);

  api.dataHandler("fetch", {
    orders,
    totalPages,
  });
});
exports.getOrderById = asyncErrorHandler(async(req,res,next)=>{
       const api = new API(req,res)
       const {id} = api.getParams()
          let allowedFields =[] 
       if(req?.role?.fieldsPermissions){
        allowedFields = [...req?.role?.fieldsPermissions,"createdAt",'stage','status']
       }
   const currentOrder = await Order.findById(id).select(allowedFields.join(" "))

  
   api.dataHandler('fetch',currentOrder)
})

exports.editOrder = asyncErrorHandler(async (req, res, next) => {
  const api = new API(req, res);
  const { id } = api.getParams();
  let updatedOrder;
    let allowedFields =[] 
       if(req?.role?.fieldsPermissions){
        allowedFields = [...req?.role?.fieldsPermissions,"createdAt",'stage','status']
       }
       if(!req.user.isAdmin){
        const bodyContent = JSON.parse(JSON.stringify(req.body))
        for(let key of Object.keys(bodyContent)){
          if(!allowedFields.includes(key)){
            delete bodyContent[key]
          }
          console.log(bodyContent);
          
        }
            updatedOrder = await Order.findByIdAndUpdate(
    id,
    { $set: bodyContent },
    { new: true, runValidators: true, context: { user: req.user } }
  );
       }else{
        updatedOrder = await Order.findByIdAndUpdate(
    id,
    { $set: req.body },
    { new: true, runValidators: true, context: { user: req.user } }
  );
       }
  

  if (!updatedOrder) {
    return next(api.errorHandler("not_found", `Order with id ${id} not found`, 404));
  }

  api.dataHandler('update', updatedOrder);
});

exports.changeOrderStage = asyncErrorHandler(async (req, res, next) => {
  const api = new API(req, res);
  const { id } = api.getParams(); // or req.params if not using custom API
  const { stageName } = req.body;

  // Validate allowed stage names
  const allowedStages = [
    'Created',
    'Approved',
    'Fraza Delivered',
    'Qsasa Delivered',
    'Return Recorded',
    'Completed',
    "Cancelled"
  ];

  if (!allowedStages.includes(stageName)) {
    return next(api.errorHandler('bad_request', 'Invalid stage name'));
  }
   let updatedOrder;
  // Find and update order
  if(stageName === 'Fraza Delivered'){
    updatedOrder = await Order.findByIdAndUpdate(
    id,
    {
      $set: {
        stage: {
          name: stageName,
          timestamp: new Date()
        },
        frazaDelivery:{
          deliveredWeight:req.body.weight,
          deliveryDate:req.body.date
        }
      }
    },
    { new: true, runValidators: true, context: { user: req.user } }
  );
  }
  else if(stageName === 'Qsasa Delivered'){
    updatedOrder = await Order.findByIdAndUpdate(
    id,
    {
      $set: {
        stage: {
          name: stageName,
          timestamp: new Date()
        },
        qsasaDelivery:{
          deliveredWeight:req.body.weight,
          deliveryDate:req.body.date
        }
      }
    },
    { new: true, runValidators: true, context: { user: req.user } }
  );
  }
  else if(stageName === 'Return Recorded'){
    updatedOrder = await Order.findByIdAndUpdate(
    id,
    {
      $set: {
        stage: {
          name: stageName,
          timestamp: new Date()
        },
        returnStore:{
          returnedWeight:req.body.weight,
          returnDate:req.body.date
        }
      }
    },
    { new: true, runValidators: true, context: { user: req.user } }
  );
  }else{
     updatedOrder = await Order.findByIdAndUpdate(
    id,
    {
      $set: {
        stage: {
          name: stageName,
          timestamp: new Date()
        }
      }
    },
    { new: true, runValidators: true, context: { user: req.user } }
  );
  }
  

  if (!updatedOrder) {
    return next(api.errorHandler('not_found', 'Order not found'));
  }

  api.dataHandler('update', { data: updatedOrder });
});
exports.cancelOrder = asyncErrorHandler(async (req, res, next) => {
  const api = new API(req, res);
  const { id } = api.getParams();

  const order = await Order.findById(id);
  if (!order) {
    return next(api.errorHandler('not_found', 'Order not found'));
  }

  if (order.status === 'Cancelled') {
    return next(api.errorHandler('bad_request', 'Order is already cancelled'));
  }

  order.status = 'Cancelled';
  order.stage = {
    name: 'Cancelled', // or 'Cancelled' if you add it to your enum
    timestamp: new Date()
  };

  // Optionally add cancellation metadata
  if (req.user?._id) {
    order.editedBy.push(req.user._id);
  }

  await order.save();

  api.dataHandler('update', { data: order });
});
exports.getOrderHistory = asyncErrorHandler(async (req, res, next) => {
      const api = new API(req, res);
  const history = await OrderHistory.find({ orderId: req.params.id }).populate('editedBy', 'name');
      api.dataHandler('fetch',history)


});
