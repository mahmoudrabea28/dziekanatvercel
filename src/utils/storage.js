const multer = require('multer');
const path = require('path'); const fs = require('fs');
const uploadDir = path.join(__dirname, '..', 'uploads');
if(!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, {recursive:true});

function fileInsideUploads(p){
  if(!p) return false;
  const full = p.startsWith('/uploads/') ? path.join(__dirname,'..',p) : p;
  return full.startsWith(uploadDir);
}
function deleteFileSafe(p){
  try{
    const full = p.startsWith('/uploads/') ? path.join(__dirname,'..',p) : p;
    if(fileInsideUploads(full) && fs.existsSync(full)) fs.unlinkSync(full);
  }catch(_){}
}

const baseStorage = multer.diskStorage({
  destination: (req,file,cb)=>cb(null, uploadDir),
  filename: (req,file,cb)=>{ const ext = path.extname(file.originalname); cb(null, Date.now()+'-'+Math.round(Math.random()*1e9)+ext) }
});

const MAX_AVATAR_SIZE = 2 * 1024 * 1024;  // 2MB
const MAX_PDF_SIZE = 10 * 1024 * 1024;    // 10MB

const uploadAvatar = multer({
  storage: baseStorage,
  limits: { fileSize: MAX_AVATAR_SIZE },
  fileFilter: (req,file,cb)=>{ const ok = /^image\//.test(file.mimetype); cb(ok?null:new Error('Only image files allowed for avatar'), ok); }
});

const uploadPdf = multer({
  storage: baseStorage,
  limits: { fileSize: MAX_PDF_SIZE },
  fileFilter: (req,file,cb)=>{ const ok = file.mimetype === 'application/pdf' || /\.pdf$/i.test(file.originalname); cb(ok?null:new Error('Only PDF files are allowed'), ok); }
});

module.exports = { uploadDir, uploadAvatar, uploadPdf, deleteFileSafe };
