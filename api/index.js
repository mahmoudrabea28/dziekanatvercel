// لو مشروعك CommonJS (type: "commonjs" في package.json) – وهو الافتراضي عندك
const app = require('../src/app');
module.exports = (req, res) => app(req, res);

// لو مشروعك ESM (type: "module") استخدم ده بدلاً منه:
// import app from '../src/app.js'
// export default (req, res) => app(req, res)
