const { Schema, model, Types } = require('mongoose');
const ReviewSchema = new Schema({
  article:{ type: Types.ObjectId, ref:'Article', required: true },
  reviewer:{ type: Types.ObjectId, ref:'User', required: true },
  grade:{ type: Number, min:1, max:5, required:true },
  comment:{ type: String, default:'' }
},{timestamps:true});
module.exports = model('Review', ReviewSchema);
