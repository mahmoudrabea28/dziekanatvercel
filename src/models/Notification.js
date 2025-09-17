const { Schema, model, Types } = require('mongoose');
const NotificationSchema = new Schema({
  user:{ type: Types.ObjectId, ref:'User', required:true },
  article:{ type: Types.ObjectId, ref:'Article', required:true },
  type:{ type:String, enum:['review'], default:'review' },
  message:{ type:String },
  payload:{ type:Object, default:{} },
  read:{ type:Boolean, default:false }
},{timestamps:true});
module.exports = model('Notification', NotificationSchema);
