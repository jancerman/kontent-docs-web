const express = require('express');
const asyncHandler = require('express-async-handler');
const router = express.Router();

const minify = require('../helpers/minify');
const isPreview = require('../helpers/isPreview');
const commonContent = require('../helpers/commonContent');
const helper = require('../helpers/helperFunctions');
const cache = require('memory-cache');

router.get('/', asyncHandler(async (req, res, next) => {
  const KCDetails = commonContent.getKCDetails(res);
  const home = cache.get(`home_${KCDetails.projectid}`);

  if (!home[0]) {
    return next();
  }

  const footer = cache.get(`footer_${KCDetails.projectid}`);
  const UIMessages = cache.get(`UIMessages_${KCDetails.projectid}`);

  return res.render('tutorials/pages/home', {
    req: req,
    minify: minify,
    slug: 'home',
    isPreview: isPreview(res.locals.previewapikey),
    title: home[0].title.value,
    titleSuffix: '',
    description: helper.stripTags(home[0].description.value).substring(0, 300),
    navigation: home[0].navigation,
    introNote: home[0].intro_note.value,
    signposts: home[0].signposts.value,
    support: home[0].support.value,
    footer: footer[0] ? footer[0] : {},
    UIMessages: UIMessages[0],
    helper: helper
  });
}));

module.exports = router;
