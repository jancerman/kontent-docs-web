const express = require('express');
const asyncHandler = require('express-async-handler');
const router = express.Router();
const moment = require('moment');

const getUrlMap = require('../helpers/urlMap');

router.get('/', asyncHandler(async (req, res, next) => {
  const urlMap = await getUrlMap(res, true);

  if (!urlMap[0]) {
    return next();
  }

  const getDomain = (req) => {
    let domain = req.protocol + '://' + req.get('Host');

    if (domain.indexOf('kcd-web-live-master') > -1) {
      domain = req.protocol + '://docs.kontent.ai';
    }

    return domain;
  };

  res.set('Content-Type', 'application/xml');

  return res.render('tutorials/pages/sitemap', {
    req: req,
    moment: moment,
    urlMap: urlMap,
    domain: getDomain(req)
  });
}));

module.exports = router;
