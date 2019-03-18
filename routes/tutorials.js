const express = require('express');
const asyncHandler = require('express-async-handler');
const router = express.Router();

const requestDelivery = require('../helpers/requestDelivery');
const getUrlMap = require('../helpers/urlMap');
const minify = require('../helpers/minify');
const isPreview = require('../helpers/isPreview');
const commonContent = require('../helpers/commonContent');
const helper = require('../helpers/helperFunctions');

const moment = require('moment');

const getNavigation = async (KCDetails) => {
    return await requestDelivery({
        type: 'home',
        depth: 1,
        ...KCDetails
    });
};

const getSubNavigation = async (KCDetails, slug) => {
    return await requestDelivery({
        type: 'navigation_item',
        depth: 3,
        slug: slug,
        ...KCDetails
    });
};

const getSubNavigationLevels = (req) => {
    return [
        typeof req.params.scenario !== 'undefined' ? req.params.scenario : null,
        typeof req.params.topic !== 'undefined' ? req.params.topic : null,
        typeof req.params.article !== 'undefined' ? req.params.article : null
    ];
};

const getContentLevel = async (currentLevel, KCDetails, urlMap, req) => {
    let settings = {
        slug: getSubNavigationLevels(req)[currentLevel],
        depth: 2,
        ...KCDetails
    };

    if (currentLevel === -1) {
        settings.type = 'navigation_item';
        settings.slug = req.originalUrl.split('/')[1];
        delete settings.depth;
    } else if (currentLevel === 0) {
        settings.type = 'scenario';
        settings.resolveRichText = true;
        settings.urlMap = urlMap;
    } else if (currentLevel === 1) {
        settings.type = 'topic';
    } else if (currentLevel === 2) {
        settings.type = 'article';
        settings.resolveRichText = true;
        settings.urlMap = urlMap;
    }

    return await requestDelivery(settings);
};

const getCurrentLevel = (levels) => {
    let index = levels.length;
    // Get last non-null array item index
    while (index-- && !levels[index]);
    return index;
};

router.get(['/tutorials', '/tutorials/:scenario', '/tutorials/:scenario/:topic', '/tutorials/:scenario/:topic/:article', '/other/:article', '/whats-new', '/whats-new/:scenario', '/whats-new/:scenario/:topic', '/whats-new/:scenario/:topic/:article'], asyncHandler(async (req, res, next) => {
    const KCDetails = commonContent.getKCDetails(res);
    const urlMap = await getUrlMap(KCDetails);
    const navigation = await getNavigation(KCDetails);
    const slug = req.originalUrl.split('/')[1];
    const subNavigation = await getSubNavigation(KCDetails, slug);
    const subNavigationLevels = getSubNavigationLevels(req);
    const currentLevel = getCurrentLevel(subNavigationLevels);
    const content = await getContentLevel(currentLevel, KCDetails, urlMap, req);
    const footer = await commonContent.getFooter(res);
    const UIMessages = await commonContent.getUIMessages(res);
    let view = 'pages/article';

    if (content[0]) {
        if (currentLevel === -1) {
            return res.redirect(301, `/${slug}/${content[0].children[0].url.value}`);
        } else if (currentLevel === 0) {
            view = 'pages/scenario';
        } else if (currentLevel === 1) {
            return res.redirect(301, `/${slug}/${subNavigationLevels[currentLevel - 1]}/${subNavigationLevels[currentLevel]}/${content[0].children[0].url.value}`);
        }
    } else {
        return next();
    }

    // If only article url slug in passed and item is present in the navigation, do not render the article
    let isIncludedNavigation = urlMap.filter(item => item.codename === content[0].system.codename).length > 0;
    if (!req.params.scenario && !req.params.topic && req.params.article && isIncludedNavigation) {
        return next();
    }

    return res.render(view, {
        req: req,
        moment: moment,
        minify: minify,
        slug: content[0] ? content[0].url.value : '',
        isPreview: isPreview(res.locals.previewapikey),
        projectId: res.locals.projectid,
        title: content[0].title.value,
        titleSuffix: ` | ${navigation[0] ? navigation[0].title.value : 'Kentico Cloud Docs'}`,
        platform: content[0].platform && content[0].platform.value.length ? content[0].platform.value : null,
        introduction: content[0].introduction ? content[0].introduction.value : null,
        nextSteps: content[0].next_steps ? content[0].next_steps : '',
        navigation: navigation[0] ? navigation[0].navigation : [],
        subNavigation: subNavigation[0] ? subNavigation[0].children : [],
        subNavigationLevels: subNavigationLevels,
        content: content[0],
        footer: footer[0] ? footer[0] : {},
        UIMessages: UIMessages[0],
        helper: helper
    });
}));

module.exports = router;
