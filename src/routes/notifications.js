const router = require('express').Router();
const { auth, hasRole } = require('../middleware/auth');
const Notification = require('../models/Notification');

router.get('/', auth, hasRole('author'), async (req,res,next)=>{
  try{ const items = await Notification.find({user:req.user._id}).sort('-createdAt'); res.json(items); }
  catch(e){ next(e); }
});
router.post('/:id/read', auth, hasRole('author'), async (req,res,next)=>{
  try{ const n = await Notification.findOne({_id:req.params.id, user:req.user._id}); if(!n) return res.status(404).json({error:'Not found'}); n.read=true; await n.save(); res.json({ok:true}); }
  catch(e){ next(e); }
});
router.post('/mark-all-read', auth, hasRole('author'), async (req,res,next)=>{
  try{ await Notification.updateMany({user:req.user._id, read:false}, {$set:{read:true}}); res.json({ok:true}); }
  catch(e){ next(e); }
});
router.get('/unread-count', auth, hasRole('author'), async (req,res,next)=>{
  try{ const c = await Notification.countDocuments({user:req.user._id, read:false}); res.json({count:c}); }
  catch(e){ next(e); }
});

module.exports = router;
