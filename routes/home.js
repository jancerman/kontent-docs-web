const express = require('express');
const asyncHandler = require('express-async-handler');
const router = express.Router();

const minify = require('../helpers/minify');
const isPreview = require('../helpers/isPreview');
const commonContent = require('../helpers/commonContent');
const helper = require('../helpers/helperFunctions');

router.get('/', asyncHandler(async (req, res, next) => {
  const KCDetails = commonContent.getKCDetails(res);

  const tree = await commonContent.getTree('home', 4, KCDetails);

  if (!tree[0]) {
    return next();
  }

  const footer = await commonContent.getFooter(res);
  const UIMessages = await commonContent.getUIMessages(res);

  return res.render('pages/home', {
    req: req,
    minify: minify,
    slug: 'home',
    isPreview: isPreview(res.locals.previewapikey),
    title: tree[0].title.value,
    titleSuffix: '',
    description: helper.stripTags(tree[0].description.value).substring(0, 300),
    navigation: tree[0].navigation,
    introNote: tree[0].intro_note.value,
    signposts: tree[0].signposts.value,
    support: tree[0].support.value,
    footer: footer[0] ? footer[0] : {},
    UIMessages: UIMessages[0],
    helper: helper
  });
}));

module.exports = router;
