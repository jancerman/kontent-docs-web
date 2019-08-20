const express = require('express');
const asyncHandler = require('express-async-handler');
const router = express.Router();

const isPreview = require('../helpers/isPreview');
const commonContent = require('../helpers/commonContent');
const helper = require('../helpers/helperFunctions');
const minify = require('../helpers/minify');
const cache = require('memory-cache');

router.get('/', asyncHandler(async (req, res) => {
    const KCDetails = commonContent.getKCDetails(res);
    const home = cache.get(`home_${KCDetails.projectid}`);
    const footer = cache.get(`footer_${KCDetails.projectid}`);
    const UIMessages = cache.get(`UIMessages_${KCDetails.projectid}`);

    let data = {
        req: req,
        minify: minify,
        slug: 'api-reference',
        isPreview: isPreview(res.locals.previewapikey),
        title: 'Api reference',
        titleSuffix: 'Kentico Cloud Docs',
        navigation: home[0].navigation,
        footer: footer[0] ? footer[0] : null,
        UIMessages: UIMessages && UIMessages.length ? UIMessages[0] : null,
        helper: helper
    };

    return res.render('apiReference/redoc/redoc-static', data);
}));

module.exports = router;
