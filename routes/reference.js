const express = require('express');
const asyncHandler = require('express-async-handler');
const router = express.Router();
const cache = require('memory-cache');
const moment = require('moment');
// const cmd = require('node-cmd');

const getUrlMap = require('../helpers/urlMap');
const commonContent = require('../helpers/commonContent');
const handleCache = require('../helpers/handleCache');
const requestDelivery = require('../helpers/requestDelivery');
const helper = require('../helpers/helperFunctions');
const isPreview = require('../helpers/isPreview');
const minify = require('../helpers/minify');
const platforms = require('../helpers/platforms');
// const prerenderOptions = require('../helpers/redoc-cli/prerender-options.js');

const handleArticle = async (settings, req, res) => {
    settings.renderSettings.view = 'apiReference/pages/reference';
    const parentSlug = req.originalUrl.split('/')[1];
    const subNavigation = await handleCache.evaluateSingle(res, `subNavigation_${req.params.slug}`, async () => {
        return await commonContent.getSubNavigation(res, parentSlug);
    });
    const platformsConfig = platforms.getPlatformsConfig(settings.KCDetails.projectid);
    let cookiesPlatform = req.cookies['KCDOCS.preselectedLanguage'];
    let availablePlatforms, preselectedPlatform, canonicalUrl;

    let preselectedPlatformSettings = platforms.getPreselectedPlatform(settings.content[0], cookiesPlatform, req, res);

    if (!preselectedPlatformSettings) {
        return null;
    }

    preselectedPlatform = preselectedPlatformSettings.preselectedPlatform;
    cookiesPlatform = preselectedPlatformSettings.cookiesPlatform;

    if (cookiesPlatform) {
        res.cookie('KCDOCS.preselectedLanguage', cookiesPlatform);
    }

    canonicalUrl = platforms.getCanonicalUrl(settings.urlMap, settings.content[0], preselectedPlatform);

    if (settings.content[0].system.type === 'multiplatform_article') {
        const multiplatformArticleContent = await platforms.getMultiplatformArticleContent(settings.content, preselectedPlatform, settings.urlMap, settings.KCDetails, res);

        if (!multiplatformArticleContent) {
            return null;
        }

        settings.content = multiplatformArticleContent.content;
        availablePlatforms = multiplatformArticleContent.availablePlatforms;
    }

    preselectedPlatform = platforms.getPreselectedPlatformByConfig(preselectedPlatform, platformsConfig);

    settings.renderSettings.data.parentSlug = parentSlug;
    settings.renderSettings.data.selectedPlatform = platforms.getSelectedPlatform(platformsConfig, cookiesPlatform);
    settings.renderSettings.data.platform = settings.content[0].platform && settings.content[0].platform.value.length ? await commonContent.normalizePlatforms(settings.content[0].platform.value, res) : null;
    settings.renderSettings.data.availablePlatforms = await commonContent.normalizePlatforms(availablePlatforms, res);
    settings.renderSettings.data.preselectedPlatform = preselectedPlatform;
    settings.renderSettings.data.introduction = settings.content[0].introduction ? settings.content[0].introduction.value : null;
    settings.renderSettings.data.nextSteps = settings.content[0].next_steps ? settings.content[0].next_steps : '';
    settings.renderSettings.data.content = settings.content[0];
    settings.renderSettings.data.subNavigation = subNavigation[0] ? subNavigation[0].children : [];
    settings.renderSettings.data.moment = moment;
    settings.renderSettings.data.canonicalUrl = canonicalUrl

    return settings.renderSettings;
};

router.get('/:main', asyncHandler(async (req, res, next) => {
    if (res.locals.router !== 'reference') {
        return next();
    }

    const slug = req.originalUrl.split('/')[1];
    const subNavigation = await handleCache.evaluateSingle(res, `subNavigation_${slug}`, async () => {
        return await commonContent.getSubNavigation(res, slug);
    });

    let redirectSlug = '';

    if (subNavigation[0] && subNavigation[0].children[0] && subNavigation[0].children[0].url) {
        redirectSlug = subNavigation[0].children[0].url.value;
    }

    return res.redirect(301, `/${slug}/${redirectSlug}`);
}));

router.get('/:main/:slug', asyncHandler(async (req, res, next) => {
    if (res.locals.router !== 'reference') {
        return next();
    }

    const KCDetails = commonContent.getKCDetails(res);
    const urlMap = await getUrlMap(res, true);
    const slug = req.params.slug;
    const home = cache.get(`home_${KCDetails.projectid}`);
    const footer = cache.get(`footer_${KCDetails.projectid}`);
    const UIMessages = cache.get(`UIMessages_${KCDetails.projectid}`);

    let content = await handleCache.evaluateSingle(res, `reference_${slug}_${KCDetails.projectid}`, async () => {
        return await requestDelivery({
            slug: slug,
            depth: 2,
            types: ['article', 'zapi_specification', 'multiplatform_article'],
            resolveRichText: true,
            urlMap: urlMap,
            ...KCDetails
        });
    });

    if (!urlMap[0]) {
        return next();
    }

    let renderSettings = {
        view: 'apiReference/pages/redoc',
        data: {
            req: req,
            minify: minify,
            slug: slug,
            isPreview: isPreview(res.locals.previewapikey),
            title: content && content.length ? content[0].title.value : '',
            titleSuffix: ` | ${home && home.length ? home[0].title.value : 'Kentico Cloud Docs'}`,
            navigation: home && home.length ? home[0].navigation : {},
            footer: footer[0] ? footer[0] : {},
            UIMessages: UIMessages && UIMessages.length ? UIMessages[0] : {},
            helper: helper
        }
    };

    if (content.length && content[0].system.type !== 'zapi_specification') {
        const settings = {
            renderSettings: renderSettings,
            content: content,
            urlMap: urlMap,
            KCDetails: KCDetails
        };

        renderSettings = await handleArticle(settings, req, res);
    }

    if (!renderSettings) {
        return next();
    }

    return res.render(renderSettings.view, renderSettings.data);
}));

module.exports = router;
