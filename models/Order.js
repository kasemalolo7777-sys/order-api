const mongoose = require('mongoose');
  const { format } = require("date-fns");

const stageSchema = new mongoose.Schema({
  name: {
    type: String,
    enum: [
      'Created',
      'Approved',
      'Fraza Delivered',
      'Qsasa Delivered',
      'Return Recorded',
      'Completed',
      "Cancelled"
    ],
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: Number,
    required: true,
    unique: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  isApproved:{
    type:Boolean,
    default:false
  },
  editedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  price: {
    type: Number,
    min: 0,
    required: true
  },
  numberOfBoxes:{
    type: Number,
    min: 0,
    required: false
  },
  finalNumberOfBoxes:{
    type: Number,
    min: 0,
    required: false
  },
  finalWeight:{
    type: Number,
    min: 0,
    required: false
  },
  status: {
    type: String,
    enum: ['Pending', 'In Progress', 'Completed', 'Cancelled'],
    default: 'Pending'
  },
  weight: {
    type: Number,
    required: true,
    min: 0
  },
  gramage: {
    type: Number,
    required: true,
    min: 0
  },
  storage:{
     type: String,
    required: false
  },
  materialType:{
        type:String,
        enum:['رول',"دغما","باكيت"]
    },
    materialResourceType:{
        type:String,
        enum:['ستوك','اوردر','stock','order'],
        required:true
    },
  length: {
    type: Number,
    required: true,
    min: 0
  },
  width: {
    type: Number,
    required: true,
    min: 0
  },
  clientName: {
    type: String,
    required: true
  },
  invoiceNumber: {
    type: String,
    required: true
  },
  invoiceDate: {
    type: Date,
    required: true
  },
  deliveryNumber: {
    type: String,
    required: true
  },
  deliveryDate: {
    type: Date,
    required: true
  },

  // الفرازة
  frazaDelivery: {
    deliveredWeight: {
      type: Number,
      default: 0,
      min: 0
    },
    deliveryDate: Date
  },

  // القصاصة
  qsasaDelivery: {
    deliveredWeight: {
      type: Number,
      default: 0,
      min: 0
    },
    deliveryDate: Date
  },

  // مرتجع القصاصة
  qsasaReturn: {
    returnedWeight: {
      type: Number,
      default: 0,
      min: 0
    },
  },

  // مرتجع الفرازة
  frazaReturn: {
    returnedWeight: {
      type: Number,
      default: 0,
      min: 0
    },
  },
  returnStore:{
    returnedWeight: {
      type: Number,
      default: 0,
      min: 0
    },
  },
  dimensionsRecord: {
    type: String,
    required: false
  },
  isApproved:{
    type: Boolean,
    required: false,
    default:false
  },

  // 6 Stages
    stage: {
    type: stageSchema,
    default: undefined
  }
}, { timestamps: true ,
});
orderSchema.pre('save', function (next) {
  if (this.isNew && !this.stage) {
    this.stage = {
      name: 'Created',
      timestamp: new Date()
    };
  }
  next();
});


function docTransform(doc, ret, options) {
  try {
    // Only format date fields that exist and are not objects
    const dateFields = ['orderDate', 'invoiceDate', 'deliveryDate', 'createdAt', 'updatedAt'];

    dateFields.forEach(field => {
      if (ret[field] instanceof Date) {
        ret[field] = format(ret[field], 'yyyy MMM dd');
      }
    });

    // Format stage timestamp safely
    if (ret.stage && ret.stage.timestamp instanceof Date) {
      ret.stage.timestamp = format(ret.stage.timestamp, 'yyyy MMM dd');
    }

    return ret;
  } catch (error) {
    console.error('Error in docTransform:', error);
    return ret; // fallback to raw object on failure
  }
}
// models/Order.js (inside orderSchema setup file)
const OrderHistory = require('./OrderHistory');

const isObject = val => typeof val === 'object' && val !== null;

const valuesAreDifferent = (a, b) => {

  
  if (isObject(a) && isObject(b)) {
    return JSON.stringify(a) !== JSON.stringify(b);
  }
  return String(a) !== String(b);
};
let oldOrderData = null;

// Pre middleware: capture old document
orderSchema.pre('findOneAndUpdate', async function (next) {
  oldOrderData = await this.model.findOne(this.getQuery()).lean();
  next();
});
// === Middleware: Log updates ===
orderSchema.post('findOneAndUpdate', async function (doc) {
  if (!doc || !oldOrderData) return;
  
  

  const update = this.getUpdate()?.$set || {};
  const user = this.getOptions()?.context?.user || null;
  const orderId = doc._id;

  // Fetch pre-update state

  const historyEntries = [];

  // Fields to ignore
  const excludedFields = ['__v', 'updatedAt', 'createdAt'];

  for (const [field, newValue] of Object.entries(update)) {
    
    
    if (excludedFields.includes(field)) continue;

    const oldValue = oldOrderData[field];

    if (valuesAreDifferent(oldValue, newValue)) {
      console.log('hi3');
      historyEntries.push({
        orderId,
        date: new Date().toLocaleString("en-US", {
          day: 'numeric',
          month: "short",
          year: 'numeric'
        }),
        name:user?.userName,
        logs: [{
          field,
          oldValue,
          newValue
        }],
        method: 'write',
        editedBy: user?._id || null,
        editedAt: new Date()
      });
    }
  }

  if (historyEntries.length > 0) {
    await OrderHistory.insertMany(historyEntries);
  }
});



module.exports = mongoose.model('Order', orderSchema);