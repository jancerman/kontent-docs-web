const express = require('express');
const asyncHandler = require('express-async-handler');
const router = express.Router();

const requestDelivery = require('../helpers/requestDelivery');
const minify = require('../helpers/minify');
const isPreview = require('../helpers/isPreview');
const commonContent = require('../helpers/commonContent');
const helper = require('../helpers/helperFunctions');
const handleCache = require('../helpers/handleCache');
const platforms = require('../helpers/platforms');

const moment = require('moment');
const cache = require('memory-cache');
let cookiesPlatform;

const getSubNavigationLevels = (req) => {
    return [
        typeof req.params.scenario !== 'undefined' ? req.params.scenario : null,
        typeof req.params.topic !== 'undefined' ? req.params.topic : null,
        typeof req.params.article !== 'undefined' ? req.params.article : null,
        typeof req.params.platform !== 'undefined' ? req.params.platform : null
    ];
};

const getContentLevel = async (currentLevel, urlMap, req, res) => {
    const KCDetails = commonContent.getKCDetails(res);

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
        settings.type = ['scenario', 'certification', 'multiplatform_article'];
        settings.resolveRichText = true;
        settings.urlMap = urlMap;
    } else if (currentLevel === 1) {
        settings.type = 'topic';
    } else if (currentLevel === 2) {
        settings.type = ['article', 'multiplatform_article'];
        settings.resolveRichText = true;
        settings.urlMap = urlMap;
    }

    let cacheKey;

    if (Array.isArray(settings.type)) {
        cacheKey = `${settings.type[0]}_${settings.slug}`;
    } else {
        cacheKey = `${settings.type}_${settings.slug}`;
    }

    return await handleCache.evaluateSingle(res, cacheKey, async () => {
        return await requestDelivery(settings);
    });
};

const getCurrentLevel = (levels) => {
    let index = levels.length;
    // Get last non-null array item index
    while (index-- && !levels[index]);
    return index;
};

const getContent = async (req, res) => {
    const KCDetails = commonContent.getKCDetails(res);
    const urlMap = cache.get(`urlMap_${KCDetails.projectid}`);
    const home = cache.get(`home_${KCDetails.projectid}`);
    const slug = req.originalUrl.split('/')[1];
    const subNavigation = await handleCache.evaluateSingle(res, `subNavigation_${slug}`, async () => {
        return await commonContent.getSubNavigation(res, slug);
    });
    const subNavigationLevels = getSubNavigationLevels(req);
    const currentLevel = getCurrentLevel(subNavigationLevels);
    const footer = cache.get(`footer_${KCDetails.projectid}`);
    const UIMessages = cache.get(`UIMessages_${KCDetails.projectid}`);
    let content = await getContentLevel(currentLevel, urlMap, req, res);
    let view = 'tutorials/pages/article';
    let availablePlatforms;

    let queryHash = req.url.split('?')[1];
    const platformsConfig = platforms.getPlatformsConfig(KCDetails.projectid);
    let preselectedPlatform;
    let canonicalUrl;
    cookiesPlatform = req.cookies['KCDOCS.preselectedLanguage'];

    if (content[0]) {
        if (currentLevel === -1) {
            return `/${slug}/${content[0].children[0].url.value}${queryHash ? '?' + queryHash : ''}`;
        } else if (currentLevel === 0 && content[0].system.type !== 'multiplatform_article') {
            if (content[0].system.type === 'certification') {
                view = 'tutorials/pages/certification';
            } else if (content[0].system.type === 'scenario') {
                view = 'tutorials/pages/scenario';
            }
        } else if (currentLevel === 1) {
            return `/${slug}/${subNavigationLevels[currentLevel - 1]}/${subNavigationLevels[currentLevel]}/${content[0].children[0].url.value}${queryHash ? '?' + queryHash : ''}`;
        } else {
            let preselectedPlatformSettings = platforms.getPreselectedPlatform(content[0], cookiesPlatform, req, res);

            if (!preselectedPlatformSettings) {
                return null;
            }

            preselectedPlatform = preselectedPlatformSettings.preselectedPlatform;
            cookiesPlatform = preselectedPlatformSettings.cookiesPlatform;

            if (cookiesPlatform) {
                res.cookie('KCDOCS.preselectedLanguage', cookiesPlatform);
            }

            canonicalUrl = platforms.getCanonicalUrl(urlMap, content[0], preselectedPlatform);

            if (content[0].system.type === 'multiplatform_article') {
                const multiplatformArticleContent = await platforms.getMultiplatformArticleContent(content, preselectedPlatform, urlMap, KCDetails, res);

               if (!multiplatformArticleContent) {
                   return null;
               }

               content = multiplatformArticleContent.content;
               availablePlatforms = multiplatformArticleContent.availablePlatforms;
            }

            preselectedPlatform = platforms.getPreselectedPlatformByConfig(preselectedPlatform, platformsConfig);
        }
    } else {
        return null;
    }

    // If only article url slug in passed and item is present in the navigation, do not render the article
    let isExcludedNavigation = urlMap.filter(item => (item.codename === content[0].system.codename) && (item.url.startsWith('/other/'))).length > 0;
    if (!req.params.scenario && !req.params.topic && req.params.article && !isExcludedNavigation) {
        return null;
    }

    return {
        view: view,
        req: req,
        res: res,
        moment: moment,
        minify: minify,
        slug: content && content.length ? content[0].url.value : '',
        isPreview: isPreview(res.locals.previewapikey),
        projectId: res.locals.projectid,
        title: content && content.length ? content[0].title.value : '',
        titleSuffix: ` | ${home && home.length ? home[0].title.value : 'Kentico Cloud Docs'}`,
        description: content && content.length && content[0].introduction ? helper.stripTags(content[0].introduction.value).substring(0, 300) : '',
        platform: content && content.length && content[0].platform && content[0].platform.value.length ? await commonContent.normalizePlatforms(content[0].platform.value, res) : null,
        availablePlatforms: await commonContent.normalizePlatforms(availablePlatforms, res),
        selectedPlatform: platforms.getSelectedPlatform(platformsConfig, cookiesPlatform),
        canonicalUrl: canonicalUrl,
        introduction: content && content.length && content[0].introduction ? content[0].introduction.value : '',
        nextSteps: content && content.length && content[0].next_steps ? content[0].next_steps : '',
        navigation: home && home.length ? home[0].navigation : [],
        subNavigation: subNavigation && subNavigation.length ? subNavigation[0].children : [],
        subNavigationLevels: subNavigationLevels,
        content: content && content.length ? content[0] : {},
        footer: footer && footer.length ? footer[0] : {},
        UIMessages: UIMessages && UIMessages.length ? UIMessages[0] : {},
        helper: helper,
        getFormValue: helper.getFormValue,
        preselectedPlatform: preselectedPlatform
    };
};

router.get(['/other/:article', '/:main', '/:main/:scenario', '/:main/:scenario/:topic', '/:main/:scenario/:topic/:article'], asyncHandler(async (req, res, next) => {
    if (res.locals.router !== 'tutorials') {
        return next();
    }

    let data = await getContent(req, res, next);
    if (data && !data.view) return res.redirect(301, data);
    if (!data) return next();

    return res.render(data.view, data);
}));

module.exports = router;
