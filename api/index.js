const app = require('../src/app');
const connect = require('../src/utils/db');
let ready = false;
module.exports = async (req, res) => {
  if (!ready) { try { await connect(); ready = true; } catch (e) { console.error(e); return res.status(500).json({error:'DB connect failed'}); } }
  return app(req, res);
};
