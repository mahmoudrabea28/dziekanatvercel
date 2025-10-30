const { Schema, model, Types } = require('mongoose');
const AssignmentSeenSchema = new Schema({
  student:{ type: Types.ObjectId, ref:'User', required:true },
  article:{ type: Types.ObjectId, ref:'Article', required:true },
  seen:{ type:Boolean, default:false }
},{ timestamps:true });
AssignmentSeenSchema.index({ student:1, article:1 }, { unique:true });
module.exports = model('AssignmentSeen', AssignmentSeenSchema);
