const express = require('express');
const router = express.Router();
const moment = require('moment');
const Entities = require('html-entities').AllHtmlEntities;
const entities = new Entities();
const asyncHandler = require('express-async-handler');

const handleCache = require('../helpers/handleCache');
const commonContent = require('../helpers/commonContent');
const helper = require('../helpers/helperFunctions');

router.get('/changelog', asyncHandler(async (req, res) => {
    const home = await handleCache.ensureSingle(res, 'home', async () => {
        return commonContent.getHome(res);
    });
    const changelog = await handleCache.ensureSingle(res, 'rss_changelog', async () => {
        return commonContent.getRSSChangelog(res);
    });

    // Regex hack to fix XML markup brokem by the Delivery SDK Rich text resolver
    const changelogItems = changelog[0].content.value.replace(/\s\s+/g, ' ').replace(/ <guid/g, '</link><guid').replace(/pubdate/g, 'pubDate').replace(/ispermalink/g, 'isPermaLink').replace(/<!--/g, '<!').replace(/-->/g, '>');

    res.set('Content-Type', 'application/xml');

    return res.render('tutorials/pages/rssApiChangelog', {
        req: req,
        helper: helper,
        home: home[0],
        entities: entities,
        moment: moment,
        title: changelog[0].title.value,
        changelog: changelogItems
    });
}));

module.exports = router;
