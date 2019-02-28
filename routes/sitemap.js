const express = require('express');
const asyncHandler = require('express-async-handler');
const router = express.Router();
const moment = require('moment');

const getUrlMap = require('../helpers/urlMap');
const commonContent = require('../helpers/commonContent');

router.get('/', asyncHandler(async (req, res, next) => {
  const KCDetails = commonContent.getKCDetails(res);

  const urlMap = await getUrlMap({
    isSitemap: true,
    ...KCDetails
  });

  if (!urlMap[0]) {
    return next();
  }

  return res.render('pages/sitemap', {
    req: req,
    moment: moment,
    urlMap: urlMap
  });
}));

module.exports = router;
