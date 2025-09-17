const router = require('express').Router();
const { auth, hasRole } = require('../middleware/auth');
const Review = require('../models/Review');
const Article = require('../models/Article');
const Notification = require('../models/Notification');

router.post('/:articleId', auth, hasRole('mentor'), async (req,res,next)=>{
  try{
    const { grade, comment = '', status } = req.body;
    if(comment && String(comment).length > 100) return res.status(400).json({error:'Comment must be 100 characters or fewer'});
    const article = await Article.findById(req.params.articleId);
    if(!article) return res.status(404).json({error:'Article not found'});
    await Review.create({ article: article._id, reviewer: req.user._id, grade, comment });
    const allowed = ['under_review','published','rejected'];
    if(status && allowed.includes(status)){
      article.status = status;
      if(status === 'published' && article.files?.length){
        const pdf = article.files.find(f=>/pdf$/i.test(f.mime));
        if(pdf) article.publishedPdfUrl = pdf.url;
      }
      await article.save();
    }
    await Notification.create({
      user: article.createdBy, article: article._id, type:'review',
      message: `Your article "${article.title}" received a review: grade ${grade}${comment?`, comment: "${String(comment).slice(0,80)}"`:''}, status: ${article.status}`,
      payload: { grade, comment, status: article.status }
    });
    res.status(201).json({ ok:true });
  }catch(e){ next(e); }
});

module.exports = router;
