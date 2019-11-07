const express = require('express');
const router = express.Router();
const moment = require('moment');
const Entities = require('html-entities').AllHtmlEntities;
const entities = new Entities();
const asyncHandler = require('express-async-handler');

const handleCache = require('../helpers/handleCache');
const getUrlMap = require('../helpers/urlMap');
const commonContent = require('../helpers/commonContent');
const helper = require('../helpers/helperFunctions');

router.get('/articles', asyncHandler(async (req, res) => {
    const urlMap = await handleCache.ensureSingle(res, 'urlMap', async () => {
        return await getUrlMap(res);
    });
    const home = await handleCache.ensureSingle(res, 'home', async () => {
        return commonContent.getHome(res);
    });
    const articles = await handleCache.ensureSingle(res, 'rss_articles', async () => {
        return commonContent.geRSSArticles(res);
    });

    res.set('Content-Type', 'application/xml');

    return res.render('tutorials/pages/rss', {
        req: req,
        home: home[0],
        helper: helper,
        entities: entities,
        moment: moment,
        articles: articles,
        urlMap: urlMap
    });
}));

module.exports = router;
