const { Schema, model, Types } = require('mongoose');
const FileSchema = new Schema({ name:String, mime:String, size:Number, url:String, publicId:String }, {_id:false});
const ArticleSchema = new Schema({
  title:{type:String, required:true},
  scientificField:{type:String, required:true},
  keywords:{type:[String], default:[]},
  abstract:{type:String, default:''},
  authors:{type:[Types.ObjectId], ref:'User', default:[]},
  authorName:{type:String},
  mentorEmail:{type:String, default:null},
  mentorName:{type:String, default:null},
  files:{type:[FileSchema], default:[]},
  status:{type:String, enum:['submitted','under_review','rejected','published'], default:'submitted'},
  version:{type:Number, default:1},
  publishedPdfUrl:{type:String, default:null},
  createdBy:{type:Types.ObjectId, ref:'User', required:true}
},{timestamps:true});
module.exports = model('Article', ArticleSchema);
