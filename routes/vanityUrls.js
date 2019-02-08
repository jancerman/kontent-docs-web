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
  return await requestDelivery({
      type: 'home',
      depth: 1,
      projectid: res.locals.projectid,
      previewapikey: res.locals.previewapikey
  });
};

const getArticles = async (res) => {
  return await requestDelivery({
      type: 'article',
      projectid: res.locals.projectid,
      previewapikey: res.locals.previewapikey
  });
};

router.get('/', asyncHandler(async (req, res, next) => {
  const urlMapSettings = {
    projectid: res.locals.projectid,
    previewapikey: res.locals.previewapikey,
  };

  const footer = await commonContent.getFooter(res);
  const UIMessages = await commonContent.getUIMessages(res);
  const navigation = await getNavigation(res);
  const articles = await getArticles(res);
  const urlMap = await getUrlMap(urlMapSettings);

  let vanityMap = [];

  articles.forEach(article => {
    if (article.vanity_urls.value) {
      let originalUrl = urlMap.filter(url => url.codename === article.system.codename);

      if (originalUrl.length) {
        vanityMap.push({
          originalUrl: originalUrl[0].url,
          vanityUrls: article.vanity_urls.value.split(';')
        });
      }
    }
  });

  return res.render('pages/vanityUrls', {
    req: req,
    minify: minify,
    isPreview: isPreview(res.locals.previewapikey),
    title: 'Vanity URLs',
    navigation: navigation[0] ? navigation[0].navigation : [],
    vanityMap: vanityMap,
    footer: footer[0],
    UIMessages: UIMessages[0],
    helper: helper
  });
}));

module.exports = router;
