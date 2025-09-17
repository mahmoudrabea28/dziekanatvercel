const { Schema, model, Types } = require('mongoose');
const AssignmentSeenSchema = new Schema({
  mentor:{ type: Types.ObjectId, ref:'User', required:true },
  article:{ type: Types.ObjectId, ref:'Article', required:true },
  seen:{ type:Boolean, default:false }
},{ timestamps:true });
AssignmentSeenSchema.index({ mentor:1, article:1 }, { unique:true });
module.exports = model('AssignmentSeen', AssignmentSeenSchema);
