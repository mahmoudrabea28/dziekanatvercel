const router = require('express').Router();
const { auth, hasRole } = require('../middleware/auth');
const { uploadPdf, deleteFileSafe } = require('../utils/storage');
const Article = require('../models/Article');
const Review = require('../models/Review');
const User = require('../models/User');
const AssignmentSeen = require('../models/AssignmentSeen');

function parseKeywords(s){ if(Array.isArray(s)) return s; if(!s) return []; return String(s).split(',').map(x=>x.trim()).filter(Boolean); }
function buildFilter(q){
  const f = {};
  if(q.title) f.title = new RegExp(q.title,'i');
  if(q.scientificField) f.scientificField = new RegExp(q.scientificField,'i');
  if(q.status) f.status = q.status;
  if(q.keywords){ const arr = parseKeywords(q.keywords); if(arr.length) f.keywords = {$in:arr}; }
  if(q.q){ f.$or = [{title:new RegExp(q.q,'i')},{scientificField:new RegExp(q.q,'i')},{abstract:new RegExp(q.q,'i')},{keywords:{$in:[new RegExp(q.q,'i')]}}]; }
  return f;
}

async function mentorNameByEmail(email){
  if(!email) return null;
  const m = await User.findOne({ email: email.toLowerCase(), role:'mentor' }).lean();
  return m ? `${m.firstName} ${m.lastName}`.trim() : null;
}

router.post('/', auth, hasRole('author'), uploadPdf.array('files',10), async (req,res,next)=>{
  try{
    const { title, scientificField, keywords, abstract, mentorEmail } = req.body;
    if(!mentorEmail) return res.status(400).json({error:'Mentor email is required'});
    if(!req.files || !req.files.length) return res.status(400).json({error:'A PDF file is required'});
    const files = (req.files||[]).map(f=>({name:f.originalname, mime:f.mimetype, size:f.size, url:`/uploads/${f.filename}`}));
    const author = req.user;
    const article = await Article.create({
      title, scientificField, keywords: parseKeywords(keywords), abstract,
      mentorEmail, mentorName: await mentorNameByEmail(mentorEmail || null),
      files, authors:[author._id], authorName: `${author.firstName} ${author.lastName}`,
      createdBy: author._id, status:'submitted'
    });
    res.status(201).json(article);
  }catch(e){ next(e); }
});

router.get('/', async (req,res,next)=>{
  try{ const arts = await Article.find(buildFilter(req.query)).sort('-createdAt'); res.json(arts); }
  catch(e){ next(e); }
});

router.get('/mine', auth, hasRole('author'), async (req,res,next)=>{
  try{ const f = buildFilter(req.query); f.createdBy = req.user._id; const arts = await Article.find(f).sort('-createdAt'); res.json(arts); }
  catch(e){ next(e); }
});

// Assigned / Done
router.get('/assigned', auth, hasRole('mentor'), async (req,res,next)=>{
  try{
    const f = buildFilter(req.query);
    f.mentorEmail = req.user.email;
    const done = String(req.query.done||'false').toLowerCase() === 'true';
    const reviewed = await Review.find({ reviewer: req.user._id }).distinct('article');
    f._id = done ? { $in: reviewed } : { $nin: reviewed };
    const arts = await Article.find(f).sort('-createdAt');
    const ids = arts.map(a=>a._id);
    const seens = await AssignmentSeen.find({ mentor: req.user._id, article: { $in: ids } }).lean();
    const seenSet = new Set(seens.filter(s=>s.seen).map(s=>String(s.article)));
    const data = arts.map(a=>({ ...a.toObject(), seen: seenSet.has(String(a._id)) }));
    res.json(data);
  }catch(e){ next(e); }
});

router.post('/assigned/:id/seen', auth, hasRole('mentor'), async (req,res,next)=>{
  try{
    const articleId = req.params.id;
    let rec = await AssignmentSeen.findOne({ mentor:req.user._id, article: articleId });
    if(!rec) rec = await AssignmentSeen.create({ mentor:req.user._id, article: articleId, seen:true });
    else { rec.seen = true; await rec.save(); }
    res.json({ok:true});
  }catch(e){ next(e); }
});

router.get('/assigned/unseen-count', auth, hasRole('mentor'), async (req,res,next)=>{
  try{
    const f = { mentorEmail: req.user.email };
    const reviewed = await Review.find({ reviewer: req.user._id }).distinct('article');
    f._id = { $nin: reviewed };
    const arts = await Article.find(f).select('_id');
    const ids = arts.map(a=>a._id);
    const seens = await AssignmentSeen.find({ mentor:req.user._id, article: { $in: ids }, seen:true }).select('article');
    const seenIds = new Set(seens.map(s=>String(s.article)));
    const unseenCount = ids.filter(id=>!seenIds.has(String(id))).length;
    res.json({ count: unseenCount });
  }catch(e){ next(e); }
});

router.get('/:id', async (req,res,next)=>{
  try{ const a = await Article.findById(req.params.id); if(!a) return res.status(404).json({error:'Not found'}); res.json(a); }
  catch(e){ next(e); }
});

router.patch('/:id', auth, hasRole('author'), uploadPdf.array('files',10), async (req,res,next)=>{
  try{
    const a = await Article.findById(req.params.id);
    if(!a) return res.status(404).json({error:'Not found'});
    if(a.createdBy.toString() !== req.user._id.toString()) return res.status(403).json({error:'Forbidden'});
    if(a.status !== 'submitted' && a.status !== 'rejected') return res.status(400).json({error:'Only editable when status is submitted or rejected'});
    const { title, scientificField, keywords, abstract, mentorEmail } = req.body;
    if(title !== undefined) a.title = title;
    if(scientificField !== undefined) a.scientificField = scientificField;
    if(keywords !== undefined) a.keywords = parseKeywords(keywords);
    if(abstract !== undefined) a.abstract = abstract;
    if(mentorEmail !== undefined){ a.mentorEmail = mentorEmail; a.mentorName = await mentorNameByEmail(mentorEmail||null); }
    const files = (req.files||[]).map(f=>({name:f.originalname, mime:f.mimetype, size:f.size, url:`/uploads/${f.filename}`}));
    if(files.length){ (a.files||[]).forEach(f=>deleteFileSafe(f.url)); a.files = files; }
    a.version += 1; await a.save(); res.json(a);
  }catch(e){ next(e); }
});

router.delete('/:id', auth, hasRole('author'), async (req,res,next)=>{
  try{
    const a = await Article.findById(req.params.id);
    if(!a) return res.status(404).json({error:'Not found'});
    if(a.createdBy.toString() !== req.user._id.toString()) return res.status(403).json({error:'Forbidden'});
    (a.files||[]).forEach(f=>deleteFileSafe(f.url));
    if(a.publishedPdfUrl) deleteFileSafe(a.publishedPdfUrl);
    await a.deleteOne(); res.json({message:'deleted'});
  }catch(e){ next(e); }
});

module.exports = router;
