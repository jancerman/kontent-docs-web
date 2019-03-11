const express = require('express');
const asyncHandler = require('express-async-handler');
const router = express.Router();

const requestDelivery = require('../helpers/requestDelivery');
const getUrlMap = require('../helpers/urlMap');
const minify = require('../helpers/minify');
const isPreview = require('../helpers/isPreview');
const commonContent = require('../helpers/commonContent');
const helper = require('../helpers/helperFunctions');

const getNavigation = async (res) => {
  const KCDetails = commonContent.getKCDetails(res);

  return await requestDelivery({
      type: 'home',
      depth: 1,
      ...KCDetails
  });
};

const getArticles = async (res) => {
  const KCDetails = commonContent.getKCDetails(res);

  return await requestDelivery({
      type: 'article',
      ...KCDetails
  });
};

const getredirectUrls = async (res) => {
  const articles = await getArticles(res);
  const KCDetails = commonContent.getKCDetails(res);
  const urlMap = await getUrlMap(KCDetails);
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

router.get('/', asyncHandler(async (req, res, next) => {
  const footer = await commonContent.getFooter(res);
  const UIMessages = await commonContent.getUIMessages(res);
  const navigation = await getNavigation(res);
  const redirectMap = await getredirectUrls(res);

  return res.render('pages/redirectUrls', {
    req: req,
    minify: minify,
    isPreview: isPreview(res.locals.previewapikey),
    title: 'Redirect URLs',
    navigation: navigation[0] ? navigation[0].navigation : [],
    redirectMap: redirectMap,
    footer: footer[0] ? footer[0] : {},
    UIMessages: UIMessages[0],
    helper: helper
  });
}));

module.exports = router;
