const express = require('express');
const asyncHandler = require('express-async-handler');
const router = express.Router();

const requestDelivery = require('../helpers/requestDelivery');
const minify = require('../helpers/minify');
const isPreview = require('../helpers/isPreview');
const commonContent = require('../helpers/commonContent');
const helper = require('../helpers/helperFunctions');

const moment = require('moment');
const cache = require('memory-cache');

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
        typeof req.params.article !== 'undefined' ? req.params.article : null,
        typeof req.params.platform !== 'undefined' ? req.params.platform : null
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
        settings.type = ['article', 'multiplatform_article'];
        settings.resolveRichText = true;
        settings.urlMap = urlMap;
    } else if (currentLevel === 3) {
        settings.type = ['article', 'multiplatform_article'];
        settings.slug = getSubNavigationLevels(req)[2];
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

const getPreselectedPlatform = (content, req) => {
    let preselectedPlatform = req.cookies['KCDOCS.preselectedLanguage'];
    let platformItems;
    if (content.children) {
        platformItems = content.children.filter(item => item.platform.value[0].codename === preselectedPlatform);
        if (platformItems.length === 0) preselectedPlatform = content.children[0].platform.value[0].codename;
    } else {
        platformItems = content.platform.value.filter(item => item.codename === preselectedPlatform);
        if (platformItems.length === 0) {
            if (cache.get('platformsConfig').length) {
                preselectedPlatform = cache.get('platformsConfig')[0].options[0].system.codename;

                let platformInArticle = content.platform.value.filter(item => item.codename === preselectedPlatform);
                if (!platformInArticle.length) {
                    preselectedPlatform = content.platform.value[0].codename;
                }
            } else {
                preselectedPlatform = content.platform.value[0].codename;
            }
        };
    }

    if (cache.get('platformsConfig').length) {
        let matchPlatform = cache.get('platformsConfig')[0].options.filter(item => item.system.codename === preselectedPlatform);
        if (matchPlatform.length) {
            preselectedPlatform = matchPlatform[0].url.value
        }
    }

    return preselectedPlatform;
}

router.get(['/tutorials', '/tutorials/:scenario', '/tutorials/:scenario/:topic', '/tutorials/:scenario/:topic/:article', '/tutorials/:scenario/:topic/:article/:platform', '/other/:article', '/whats-new', '/whats-new/:scenario', '/whats-new/:scenario/:topic', '/whats-new/:scenario/:topic/:article'], asyncHandler(async (req, res, next) => {
    const KCDetails = commonContent.getKCDetails(res);
    const urlMap = cache.get('urlMap');
    const navigation = await getNavigation(KCDetails);
    const slug = req.originalUrl.split('/')[1];
    const subNavigation = await getSubNavigation(KCDetails, slug);
    const subNavigationLevels = getSubNavigationLevels(req);
    const currentLevel = getCurrentLevel(subNavigationLevels);
    const footer = await commonContent.getFooter(res);
    const UIMessages = await commonContent.getUIMessages(res);
    let content = await getContentLevel(currentLevel, KCDetails, urlMap, req);
    let view = 'pages/article';
    let availablePlatforms;

    let queryHash = req.url.split('?')[1];

    if (content[0]) {
        if (currentLevel === -1) {
            return res.redirect(301, `/${slug}/${content[0].children[0].url.value}${queryHash ? '?' + queryHash : ''}`);
        } else if (currentLevel === 0) {
            view = 'pages/scenario';
        } else if (currentLevel === 1) {
            return res.redirect(301, `/${slug}/${subNavigationLevels[currentLevel - 1]}/${subNavigationLevels[currentLevel]}/${content[0].children[0].url.value}${queryHash ? '?' + queryHash : ''}`);
        } else if (currentLevel === 2) {
            if (content[0].system.type === 'multiplatform_article' || (content[0].system.type === 'article' && content[0].platform.value.length)) {
                let preselectedPlatform = getPreselectedPlatform(content[0], req);
                return res.redirect(301, `/${slug}/${subNavigationLevels[currentLevel - 2]}/${subNavigationLevels[currentLevel - 1]}/${subNavigationLevels[currentLevel]}/${preselectedPlatform}${queryHash ? '?' + queryHash : ''}`);
            }
        } else if (currentLevel === 3) {
            let preselectedPlatform = req.params.platform;
            if (cache.get('platformsConfig').length) {
                preselectedPlatform = cache.get('platformsConfig')[0].options.filter(item => item.url.value === preselectedPlatform);
                if (preselectedPlatform.length) {
                    preselectedPlatform = preselectedPlatform[0].system.codename;
                    res.cookie('KCDOCS.preselectedLanguage', preselectedPlatform);
                }
            }

            if (content[0].system.type === 'multiplatform_article') {
                let platformItem = content[0].children.filter(item => item.platform.value[0].codename === preselectedPlatform);
                availablePlatforms = content[0].children;

                content = await requestDelivery({
                    codename: platformItem[0].system.codename,
                    type: 'article',
                    depth: 2,
                    resolveRichText: true,
                    urlMap: urlMap,
                    ...KCDetails
                });
            }
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
        platform: content[0].platform && content[0].platform.value.length ? commonContent.normalizePlatforms(content[0].platform.value) : null,
        availablePlatforms: commonContent.normalizePlatforms(availablePlatforms),
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
