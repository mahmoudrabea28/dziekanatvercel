const router = require('express').Router();
const Article = require('../models/Article');
const PDFDocument = require('pdfkit');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

function stats(items){ const c={submitted:0,under_review:0,rejected:0,published:0}; for(const a of items){ c[a.status]=(c[a.status]||0)+1 } return c; }

router.get('/articles.pdf', async (req,res,next)=>{
  try{
    const items = await Article.find({}).sort('title');
    const s = stats(items);
    res.setHeader('Content-Type','application/pdf');
    res.setHeader('Content-Disposition','attachment; filename="articles.pdf"');
    const doc = new PDFDocument({margin:40}); doc.pipe(res);
    doc.fontSize(18).text('Akademion - Articles Export', {align:'center'}); doc.moveDown();
    doc.fontSize(12);
    items.forEach((a,i)=>{
      doc.text(`${i+1}. ${a.title}`);
      doc.text(`   Author: ${a.authorName||''}`);
      doc.text(`   Mentor: ${a.mentorName || a.mentorEmail || '-'}`);
      doc.text(`   Field: ${a.scientificField}`);
      doc.text(`   Keywords: ${(a.keywords||[]).join(', ')}`);
      doc.text(`   Abstract: ${a.abstract}`);
      doc.text(`   Status: ${a.status}`);
      doc.moveDown();
    });
    doc.addPage().fontSize(16).text('Summary', {underline:true}).moveDown().fontSize(12);
    doc.text(`Total submissions: ${items.length}`);
    doc.text(`Published: ${s.published}`);
    doc.text(`Under review: ${s.under_review}`);
    doc.text(`Rejected: ${s.rejected}`);
    doc.text(`Submitted: ${s.submitted}`);
    doc.end();
  }catch(e){ next(e); }
});

router.get('/articles.csv', async (req,res,next)=>{
  try{
    const items = await Article.find({}).sort('title');
    const path = require('path'); const tmp = path.join(__dirname,'..','uploads','articles.csv');
    const csv = createCsvWriter({ path: tmp, header:[
      {id:'title', title:'Title'},{id:'authorName', title:'Author'},{id:'mentorEmail', title:'MentorEmail'},{id:'mentorName', title:'MentorName'},
      {id:'scientificField', title:'Field'},{id:'keywords', title:'Keywords'},{id:'abstract', title:'Abstract'},{id:'status', title:'Status'}
    ]});
    await csv.writeRecords(items.map(a=>({ title:a.title, authorName:a.authorName||'', mentorEmail:a.mentorEmail||'', mentorName:a.mentorName||'',
      scientificField:a.scientificField||'', keywords:(a.keywords||[]).join('; '), abstract:a.abstract||'', status:a.status })));
    res.download(tmp,'articles.csv');
  }catch(e){ next(e); }
});

module.exports = router;
