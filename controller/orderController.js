const API = require("../classes/Api");
const Material = require("../models/Material");
const Order = require("../models/Order");
const OrderHistory = require("../models/OrderHistory");
const User = require("../models/User");
const { formatDates } = require("../utils");
const asyncErrorHandler = require("./../wrapper_functions/asyncErrorHandler");
const dotenv = require("dotenv");
dotenv.config({path: '../config.env'});



exports.createOrder = asyncErrorHandler(async (req,res,next)=>{
      const api = new API(req, res);
      const totalItems = await Order.countDocuments()
      const {materialId} = req.query
      const currentMaterial = await Material.findById(materialId)
      if(req.body.weight > currentMaterial.weight){
        const error = api.errorHandler('uncomplated_data','الوزن المطلوب اكبر من المتاح')
         next(error)
      }else {
         await currentMaterial.updateOne({
          $set:{
            weight:currentMaterial.weight - req.body.weight
          }
         })
      }
      const newOrder = await Order.create({
        ...req.body,
        orderNumber:totalItems+1,
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
       let notAllowedFields =[] 
       if(req?.role?.fieldsPermissions){
        notAllowedFields = [...req?.role?.fieldsPermissions,]
        notAllowedFields = notAllowedFields.map(item => `-${item}`)
       }
   
  api.modify(Order.find().populate({
        path: 'createdBy',
        select: 'userName  -_id' // Only get the role name
      }).lean()).filter([],['price','orderNumber']).sort().limitFields(notAllowedFields).paginate()
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
          let notAllowedFields =[] 
       if(req?.role?.fieldsPermissions){
        notAllowedFields = [...req?.role?.fieldsPermissions,]
        
       }
   const currentOrder = await Order.findById(id).select(notAllowedFields.join(""))

  
   api.dataHandler('fetch',currentOrder)
})

exports.editOrder = asyncErrorHandler(async (req, res, next) => {
  const api = new API(req, res);
  const { id } = api.getParams();
  let updatedOrder;
    let notAllowedFields =[] 
       if(req?.role?.fieldsPermissions){
        notAllowedFields = [...req?.role?.fieldsPermissions]
       }
       if(!req.user.isAdmin){
        const bodyContent = JSON.parse(JSON.stringify(req.body))
        for(let key of Object.keys(bodyContent)){
          if(notAllowedFields.includes(key)){
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
  const currentOrder = await Order.findById(id)
  // Validate allowed stage names
  if(!currentOrder.isApproved){
    return next(api.errorHandler('uncomplated_data','لا يمكن الانتقال الى مرحلة اخرى قبل تأكيد معلومات الطلب'))
  }
  const allowedStages = [
    'Created',
    'Approved',
    'Fraza Delivered',
    'Qsasa Delivered',
    'Return Recorded',
    'Completed',
    "Cancelled"
  ];
  const currentMaterial = await Material.findOne({
    width:currentOrder.width,
    length:currentOrder.length,
    gramage:currentOrder.gramage,
    materialResourceType:currentOrder.materialResourceType,
    materialType:currentOrder.materialType,
    storage:currentOrder.storage
  })
  if (!allowedStages.includes(stageName)) {
    return next(api.errorHandler('bad_request', 'Invalid stage name'));
  }
   if(req.body.weight){
    const diffWeight = (req.body.weight) - currentOrder.weight
    if( diffWeight > 0 & currentMaterial.weight - diffWeight < 0 ){
    const error = api.errorHandler('uncomplated_data','الوزن المطلوب غير متوفر بالمخزن')
    return next(error)
  }else if(diffWeight > 0){
   await currentMaterial.updateOne({
    $set:{
      weight:(currentMaterial.weight - diffWeight) +currentOrder.storage === req.body.storage?(req.body.returnWeight || 0):0
    }
   })
  }else{
     await currentMaterial.updateOne({
    $set:{
      weight:currentMaterial.weight + currentOrder.storage === req.body.storage?(req.body.returnWeight || 0):0
    }
   })
  }
   }
   if(req.body.returnedWeight && currentOrder.storage !== req.body.storage){
    const storageMaterial = await Material.findOne({
       width:currentOrder.width,
    length:currentOrder.length,
    gramage:currentOrder.gramage,
    materialResourceType:currentOrder.materialResourceType,
    materialType:currentOrder.materialType,
    storage:req.body.storage
    })
    if(storageMaterial){
      storageMaterial.updateOne({
        $set:{
           weight:storageMaterial.weight + req.body.returnedWeight
        }
      })
    }else{
      await Material.create({
         width:currentOrder.width,
    length:currentOrder.length,
    gramage:currentOrder.gramage,
    materialResourceType:currentOrder.materialResourceType,
    materialType:currentOrder.materialType,
    storage:req.body.storage,
    weight:req.body.returnedWeight,
    name:currentMaterial.name,
    invoiceNumber:currentMaterial.invoiceNumber
      })
    }
   }
 
   let updatedOrder;
  // Find and update order
  if(stageName === 'Approved'){
    if(currentOrder.storage === ''){
      const error = api.errorHandler('uncomplated_data','اسم المستودع غير موجود يجب تحديث اسم المستودع حتى يتم الموافقة على الطلب')
       return next(error)
    }
    await currentOrder.updateOne({
      $set:{
        isApproved:true
      }
    },{ new: true, runValidators: true, context: { user: req.user } })
  }
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
        },
         frazaReturn:{
            returnedWeight:req.body.returnWeight
         },
         storage:req.body.storage,
        isApproved:false
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
        },
        qsasaReturn:{
                      returnedWeight:req.body.returnedWeight
        },
         storage:req.body.storage,
         isApproved:false
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
        },
         
         isApproved:false
      }
    },
    { new: true, runValidators: true, context: { user: req.user } }
  );
  }else if(stageName === 'Completed'){
     updatedOrder = await Order.findByIdAndUpdate(
    id,
    {
      $set: {
        stage: {
          name: stageName,
          timestamp: new Date()
        },
        finalWeight:req.body.finalWeight,
        finalNumberOfBoxes:req.body.numberOfBoxes
      },
       isApproved:false
    },
    { new: true, runValidators: true, context: { user: req.user } }
  );
  }
  else{
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
exports.approveOrder = asyncErrorHandler(async (req, res, next) => {
  const api = new API(req, res);

  const { id } = api.getParams(); // or req.params if not using custom API
  const { stageName } = req.body;
  console.log(stageName);
  
  const currentOrder = await Order.findById(id)
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

  if ((!req.user?.stage?.includes('stageName') || !req.user?.storage?.includes(currentOrder.storage)) && !req.user.isAdmin) {
    return next(api.errorHandler('bad_request', 'لا تملك الصلاحية للموافقة على هذه المرحلة'));
  }
   let updatedOrder;
  // Find and update order
      if(stageName === 'Approved'){
    if(currentOrder.storage === ''){
      const error = api.errorHandler('uncomplated_data','اسم المستودع غير موجود يجب تحديث اسم المستودع حتى يتم الموافقة على الطلب')
       return next(error)
    }
    await currentOrder.updateOne({
      $set:{
        isApproved:true
      }
    },{ new: true, runValidators: true, context: { user: req.user } })
  }
     if(stageName === 'Created' || stageName === 'Approved' ){
      console.log('test');
      
      updatedOrder = await Order.findByIdAndUpdate(
    id,
    {
      $set: {
        stage: {
          name: "Approved",
          timestamp: new Date()
        },
        isApproved:true
      }
    },
    { new: true, runValidators: true, context: { user: req.user } }
  );
      
     }else{
         updatedOrder = await Order.findByIdAndUpdate(
    id,
    {
      $set: {
        isApproved:true
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