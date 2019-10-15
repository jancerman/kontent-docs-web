const express = require('express');
const router = express.Router();

const minify = require('../helpers/minify');
const isPreview = require('../helpers/isPreview');
const commonContent = require('../helpers/commonContent');
const helper = require('../helpers/helperFunctions');
const getUrlMap = require('../helpers/urlMap');
const handleCache = require('../helpers/handleCache');

const getRedirectUrls = async (res) => {
  const articles = await handleCache.ensureSingle(res, `articles`, async () => {
    return await commonContent.getArticles(res);
  });
  const urlMap = await handleCache.ensureSingle(res, `urlMap`, async () => {
    return await getUrlMap(res);
  });

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
};

router.get('/', async (req, res) => {
  const footer = await handleCache.ensureSingle(res, `footer`, async () => {
    return commonContent.getFooter(res);
  });
  const UIMessages = await handleCache.ensureSingle(res, `UIMessages`, async () => {
    return commonContent.getUIMessages(res);
  });
  const home = await handleCache.ensureSingle(res, `home`, async () => {
    return commonContent.getHome(res);
  });
  const redirectMap = await getRedirectUrls(res);
  const platformsConfigPairings = await commonContent.getPlatformsConfigPairings(res);

  return res.render('tutorials/pages/redirectUrls', {
    req: req,
    minify: minify,
    isPreview: isPreview(res.locals.previewapikey),
    title: 'Redirect URLs',
    navigation: home[0] ? home[0].navigation : [],
    redirectMap: redirectMap,
    footer: footer[0] ? footer[0] : null,
    UIMessages: UIMessages && UIMessages.length ? UIMessages[0] : null,
    platformsConfig: platformsConfigPairings && platformsConfigPairings.length ? platformsConfigPairings : null,
    helper: helper
  });
});

module.exports = router;
