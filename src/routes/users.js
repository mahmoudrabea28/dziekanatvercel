const router = require('express').Router();
const User = require('../models/User');
const Article = require('../models/Article');
const { auth } = require('../middleware/auth');
const { uploadAvatar, deleteFileSafe } = require('../utils/storage');

router.get('/me', auth, async (req,res)=>{ res.json(req.user) });

router.patch('/me', auth, uploadAvatar.single('avatar'), async (req,res,next)=>{
  try{
    const { firstName, lastName, phone, password } = req.body;
    if(firstName !== undefined) req.user.firstName = firstName;
    if(lastName !== undefined) req.user.lastName = lastName;
    if(phone !== undefined) req.user.phone = phone;
    if(password) await req.user.setPassword(password);
    if(req.file){ if(req.user.avatarUrl) deleteFileSafe(req.user.avatarUrl); req.user.avatarUrl = `/uploads/${req.file.filename}`; }
    await req.user.save();
    try{
      const fullName = `${req.user.firstName} ${req.user.lastName}`.trim();
      await Article.updateMany({ createdBy: req.user._id }, { $set: { authorName: fullName } });
      if(req.user.role === 'mentor'){
        await Article.updateMany({ mentorEmail: req.user.email }, { $set: { mentorName: fullName } });
      }
    }catch(_){}
    res.json(req.user);
  }catch(e){ next(e); }
});

module.exports = router;
