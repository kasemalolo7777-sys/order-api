const { default: mongoose } = require("mongoose");

const materialSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    invoiceNumber:{
        type:Number,
        required:true
    },
    materialResourceType:{
        type:String,
        enum:['ستوك','اوردر','stock','order'],
        required:true
    },
    length:{
        type:Number,
        require:false
    },
    width:{
        type:Number,
        require:false
    },
    gramage:{
        type:Number,
        require:true
    },
    weight:{
        type:Number,
        require:true
    },
    materialType:{
        type:String,
        enum:['رول',"دغما","باكيت"]
    },
    storage:{
         type:String,
    }
})
const Material = mongoose.model('Material',materialSchema)
module.exports = Material;