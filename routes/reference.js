const express = require('express');
const asyncHandler = require('express-async-handler');
const router = express.Router();
const cache = require('memory-cache');
const moment = require('moment');
const axios = require('axios');
const htmlparser2 = require('htmlparser2');
const cheerio = require('cheerio');

const commonContent = require('../helpers/commonContent');
const handleCache = require('../helpers/handleCache');
const requestDelivery = require('../helpers/requestDelivery');
const helper = require('../helpers/helperFunctions');
const isPreview = require('../helpers/isPreview');
const minify = require('../helpers/minify');
const platforms = require('../helpers/platforms');

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

    if (settings.content && settings.content.length && settings.content[0].system.type === 'multiplatform_article') {
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
    settings.renderSettings.data.platform = settings.content && settings.content.length && settings.content[0].platform && settings.content[0].platform.value.length ? await commonContent.normalizePlatforms(settings.content[0].platform.value, res) : null;
    settings.renderSettings.data.availablePlatforms = await commonContent.normalizePlatforms(availablePlatforms, res);
    settings.renderSettings.data.preselectedPlatform = preselectedPlatform;
    settings.renderSettings.data.introduction = settings.content && settings.content.length && settings.content[0].introduction ? settings.content[0].introduction.value : null;
    settings.renderSettings.data.nextSteps = settings.content && settings.content.length && settings.content[0].next_steps ? settings.content[0].next_steps : '';
    settings.renderSettings.data.content = settings.content && settings.content.length ? settings.content[0] : null;
    settings.renderSettings.data.subNavigation = subNavigation[0] ? subNavigation[0].children : [];
    settings.renderSettings.data.moment = moment;
    settings.renderSettings.data.canonicalUrl = canonicalUrl

    return settings.renderSettings;
};

const resolveLinks = (data, urlMap) => {
    const parserOptions = {
        decodeEntities: true,
        lowerCaseAttributeNames: false,
        lowerCaseTags: false,
        recognizeSelfClosing: false,
    };

    const dom = htmlparser2.parseDOM(data.data, parserOptions);
    const $ = cheerio.load(dom);
    const links = $('a[href]');

    for (let i = 0; i < links.length; i++) {
        const link = $(links[i]);
        if (link.attr('href').indexOf('/link-to/') > -1) {
            const urlParts = link.attr('href').split('/');
            const codename = urlParts[urlParts.length - 1];

            for (let i = 0; i < urlMap.length; i++) {
                if (urlMap[i].codename === codename) {
                    link.attr('href', urlMap[i].url);
                }
            }
        }
    }

    data.data = $.root().html().trim();
    return data;
};

const getRedocReference = async (apiCodename, res) => {
    return await handleCache.evaluateSingle(res, `reDocReference_${apiCodename}`, async () => {
        let baseURL = process.env['referenceRenderUrl'];
        let data = '';

        if (baseURL) {
            data = await axios.get(`${baseURL}/api/ProviderStarter?api=${apiCodename}&isPreview=${isPreview(res.locals.previewapikey)}`);
        }

        return data;
    });
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

/* Temporary  endpoint for release purpose */
router.get('/redoc/:slug', asyncHandler(async (req, res, next) => {
    const KCDetails = commonContent.getKCDetails(res);
    const urlMap = cache.get(`urlMap_${KCDetails.projectid}`);
    const slug = req.params.slug;
    const home = cache.get(`home_${KCDetails.projectid}`);
    const footer = cache.get(`footer_${KCDetails.projectid}`);
    const UIMessages = cache.get(`UIMessages_${KCDetails.projectid}`);
    const platformsConfigPairings = commonContent.getPlatformsConfigPairings(res);

    let content = await handleCache.evaluateSingle(res, `reference_${slug}`, async () => {
        return await requestDelivery({
            slug: slug,
            depth: 2,
            types: ['zapi_specification'],
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
            titleSuffix: ` | ${home && home.length ? home[0].title.value : 'Kentico Kontent Docs'}`,
            navigation: home && home.length ? home[0].navigation : null,
            footer: footer && footer.length ? footer[0] : null,
            UIMessages: UIMessages && UIMessages.length ? UIMessages[0] : null,
            platformsConfig: platformsConfigPairings && platformsConfigPairings.length ? platformsConfigPairings : null,
            helper: helper
        }
    };

    if (content && content.length && content[0].system.type === 'zapi_specification') {
        renderSettings.data.content = await getRedocReference(content[0].system.codename, res);
        renderSettings.data.content = resolveLinks(renderSettings.data.content, urlMap);
    }

    if (!renderSettings) {
        return next();
    }

    return res.render(renderSettings.view, renderSettings.data);
}));

router.get('/:main/:slug', asyncHandler(async (req, res, next) => {
    if (res.locals.router !== 'reference') {
        return next();
    }

    const KCDetails = commonContent.getKCDetails(res);
    const urlMap = cache.get(`urlMap_${KCDetails.projectid}`);
    const slug = req.params.slug;
    const home = cache.get(`home_${KCDetails.projectid}`);
    const footer = cache.get(`footer_${KCDetails.projectid}`);
    const UIMessages = cache.get(`UIMessages_${KCDetails.projectid}`);
    const platformsConfigPairings = commonContent.getPlatformsConfigPairings(res);

    let content = await handleCache.evaluateSingle(res, `reference_${slug}`, async () => {
        return await requestDelivery({
            slug: slug,
            depth: 2,
            types: ['scenario', 'article', 'zapi_specification', 'multiplatform_article'],
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
            titleSuffix: ` | ${home && home.length ? home[0].title.value : 'Kentico Kontent Docs'}`,
            navigation: home && home.length ? home[0].navigation : null,
            footer: footer && footer.length ? footer[0] : null,
            UIMessages: UIMessages && UIMessages.length ? UIMessages[0] : null,
            platformsConfig: platformsConfigPairings && platformsConfigPairings.length ? platformsConfigPairings : null,
            helper: helper
        }
    };

    if (content && content.length && content[0].system.type === 'zapi_specification') {
        renderSettings.data.content = await getRedocReference(content[0].system.codename, res);
        renderSettings.data.content = resolveLinks(renderSettings.data.content, urlMap);
    } else {
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
