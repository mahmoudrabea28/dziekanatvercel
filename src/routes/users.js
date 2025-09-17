const router = require('express').Router();
const User = require('../models/User');
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
    res.json(req.user);
  }catch(e){ next(e); }
});

router.get('/', async (req,res,next)=>{
  try{
    const { role } = req.query;
    const q = role ? { role } : {};
    const users = await User.find(q).select('_id email firstName lastName role avatarUrl');
    res.json(users);
  }catch(e){ next(e); }
});

module.exports = router;
