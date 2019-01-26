const express = require('express');
const asyncHandler = require('express-async-handler');
const router = express.Router();

const requestDelivery = require('../helpers/requestDelivery');
const getUrlMap = require('../helpers/urlMap');
const minify = require('../helpers/minify');
const isPreview = require('../helpers/isPreview');

const moment = require('moment');

router.get(['/', '/:scenario', '/:scenario/:topic', '/:scenario/:topic/:article'], asyncHandler(async (req, res, next) => {
    const navigation = await requestDelivery({
        type: 'home',
        depth: 1,
        projectid: res.locals.projectid,
        previewapikey: res.locals.previewapikey
    });

    const subNavigation = await requestDelivery({
        type: 'navigation_item',
        depth: 3,
        slug: 'tutorials',
        projectid: res.locals.projectid,
        previewapikey: res.locals.previewapikey
    });

    const subNavigationLevels = [
        typeof req.params.scenario !== 'undefined' ? req.params.scenario : null,
        typeof req.params.topic !== 'undefined' ? req.params.topic : null,
        typeof req.params.article !== 'undefined' ? req.params.article : null
    ];

    const currentLevel = subNavigationLevels.filter( item => item !== null ).length - 1;

    let content, view;

    if (currentLevel === -1) {
        content = await requestDelivery({
            type: 'navigation_item',
            slug: req.originalUrl.split('/')[1],
            projectid: res.locals.projectid,
            previewapikey: res.locals.previewapikey
        });

        if (content[0]) {
            return res.redirect(`/tutorials/${content[0].children[0].url.value}`);
        }

        return next();
    } else if (currentLevel === 0) {
        content = await requestDelivery({
            type: 'scenario',
            depth: 1,
            slug: subNavigationLevels[currentLevel],
            resolveRichText: true,
            urlMap: await getUrlMap({
                projectid: res.locals.projectid,
                previewapikey: res.locals.previewapikey 
            }),
            projectid: res.locals.projectid,
            previewapikey: res.locals.previewapikey
        });

        if (!content[0]) {
            return next();
        }

        view = 'pages/scenario';
    } else if (currentLevel === 1) {
        content = await requestDelivery({
            type: 'topic',
            depth: 1,
            slug: subNavigationLevels[currentLevel],
            projectid: res.locals.projectid,
            previewapikey: res.locals.previewapikey
        });

        if (content[0]) {
            return res.redirect(`/tutorials/${subNavigationLevels[currentLevel - 1]}/${subNavigationLevels[currentLevel]}/${content[0].children[0].url.value}`);
        }

        return next();
    } else if (currentLevel === 2) {
        content = await requestDelivery({
            type: 'article',
            depth: 1,
            slug: subNavigationLevels[currentLevel],
            resolveRichText: true,
            urlMap: await getUrlMap({
                projectid: res.locals.projectid,
                previewapikey: res.locals.previewapikey 
            }),
            projectid: res.locals.projectid,
            previewapikey: res.locals.previewapikey
        });

        if (!content[0]) {
            return next();
        }

        view = 'pages/article';
    } else {
        return next();
    }

    return res.render(view, {
        req: req,
        moment: moment,
        minify: minify,
        isPreview: isPreview(res.locals.previewapikey),
        projectId: res.locals.projectid || process.env['KC.ProjectId'],
        title: content[0].title.value,
        description: content[0].description.value,
        navigation: navigation[0] ? navigation[0].navigation : [],
        subNavigation: subNavigation[0] ? subNavigation[0].children : [],
        subNavigationLevels: subNavigationLevels,
        content: content[0]
    });
}));

module.exports = router;