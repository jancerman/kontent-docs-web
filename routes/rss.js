const express = require('express');
const router = express.Router();
const cache = require('memory-cache');
const moment = require('moment');
const Entities = require('html-entities').AllHtmlEntities;
const entities = new Entities();

const commonContent = require('../helpers/commonContent');
const helper = require('../helpers/helperFunctions');

router.get('/articles', (req, res, next) => {
    const KCDetails = commonContent.getKCDetails(res);

    const urlMap = cache.get(`urlMap_${KCDetails.projectid}`);
    const home = cache.get(`home_${KCDetails.projectid}`);
    const articles = cache.get(`rss_articles_${KCDetails.projectid}`);

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
});

module.exports = router;
