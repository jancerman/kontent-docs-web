const express = require('express');
const router = express.Router();
const secured = require('../helpers/secured');
const isPreview = require('../helpers/isPreview');
const commonContent = require('../helpers/commonContent');
const minify = require('../helpers/minify');
const helper = require('../helpers/helperFunctions');
const handleCache = require('../helpers/handleCache');
const asyncHandler = require('express-async-handler');

router.get('/elearning', secured(), asyncHandler(async (req, res, next) => {
  const footer = await handleCache.ensureSingle(res, 'footer', async (res) => {
    return commonContent.getFooter(res);
  });

  const UIMessages = await handleCache.ensureSingle(res, 'UIMessages', async () => {
      return commonContent.getUIMessages(res);
  });

  const platformsConfigPairings = await commonContent.getPlatformsConfigPairings(res);

  const content = await handleCache.ensureSingle(res, 'notFound', async () => {
      return commonContent.getNotFound(res);
  });

  const home = await handleCache.ensureSingle(res, 'home', async () => {
      return commonContent.getHome(res);
  });

  if (!footer || !UIMessages || !content || !home) {
      return res.status(500).send('Unexpected error, please check site logs.');
  }

  res.render('tutorials/pages/elearning', {
    req: req,
    minify: minify,
    slug: 'elearning',
    isPreview: isPreview(res.locals.previewapikey),
    title: 'E-learning',
    titleSuffix: ` | ${home && home.length ? home[0].title.value : 'Kentico Kontent Docs'}`,
    description: 'Test',
    navigation: home[0].navigation.value,
    footer: footer && footer.length ? footer[0] : null,
    UIMessages: UIMessages && UIMessages.length ? UIMessages[0] : null,
    platformsConfig: platformsConfigPairings && platformsConfigPairings.length ? platformsConfigPairings : null,
    helper: helper,
  });
}));

module.exports = router;