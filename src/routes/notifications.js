const router = require('express').Router();
const { auth, hasRole } = require('../middleware/auth');
const Notification = require('../models/Notification');

router.get('/', auth, hasRole('author'), async (req,res,next)=>{
  try{ const items = await Notification.find({user:req.user._id}).sort('-createdAt'); res.json(items); }
  catch(e){ next(e); }
});

module.exports = router;
