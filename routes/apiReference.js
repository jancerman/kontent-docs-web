const express = require('express');
const asyncHandler = require('express-async-handler');
const router = express.Router();

const isPreview = require('../helpers/isPreview');
const commonContent = require('../helpers/commonContent');
const helper = require('../helpers/helperFunctions');
const minify = require('../helpers/minify');

router.get('/', asyncHandler(async (req, res) => {
    const KCDetails = commonContent.getKCDetails(res);
    const tree = await commonContent.getTree('home', 1, KCDetails);
    const footer = await commonContent.getFooter(res);
    const UIMessages = await commonContent.getUIMessages(res);

    let data = {
        req: req,
        minify: minify,
        slug: 'api-reference',
        isPreview: isPreview(res.locals.previewapikey),
        title: 'Api reference',
        titleSuffix: 'Kentico Cloud Docs',
        navigation: tree[0].navigation,
        footer: footer[0] ? footer[0] : {},
        UIMessages: UIMessages[0],
        helper: helper
    };

    return res.render('apiReference/pages/home', data);
}));

module.exports = router;
