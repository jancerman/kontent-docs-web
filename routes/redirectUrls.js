const express = require('express');
const asyncHandler = require('express-async-handler');
const router = express.Router();
const cache = require('memory-cache');

const requestDelivery = require('../helpers/requestDelivery');
const minify = require('../helpers/minify');
const isPreview = require('../helpers/isPreview');
const commonContent = require('../helpers/commonContent');
const helper = require('../helpers/helperFunctions');

const getArticles = async (res) => {
  const KCDetails = commonContent.getKCDetails(res);

  return await requestDelivery({
      type: 'article',
      ...KCDetails
  });
};

const getredirectUrls = async (res) => {
  const KCDetails = commonContent.getKCDetails(res);

  const articles = await getArticles(res);
  const urlMap = cache.get(`urlMap_${KCDetails.projectid}`);
  let redirectMap = [];

  articles.forEach(article => {
    if (article.redirect_urls.value) {
      let originalUrl = urlMap.filter(url => url.codename === article.system.codename);

      if (originalUrl.length) {
        redirectMap.push({
          originalUrl: originalUrl[0].url,
          redirectUrls: article.redirect_urls.value.split(';')
        });
      }
    }
  });

  return redirectMap;
}

router.get('/', asyncHandler(async (req, res) => {
  const KCDetails = commonContent.getKCDetails(res);
  const footer = cache.get(`footer_${KCDetails.projectid}`);
  const UIMessages = cache.get(`UIMessages_${KCDetails.projectid}`);
  const home = cache.get(`home_${KCDetails.projectid}`);
  const redirectMap = await getredirectUrls(res);

  return res.render('tutorials/pages/redirectUrls', {
    req: req,
    minify: minify,
    isPreview: isPreview(res.locals.previewapikey),
    title: 'Redirect URLs',
    navigation: home[0] ? home[0].navigation : [],
    redirectMap: redirectMap,
    footer: footer[0] ? footer[0] : {},
    UIMessages: UIMessages[0],
    helper: helper
  });
}));

module.exports = router;
