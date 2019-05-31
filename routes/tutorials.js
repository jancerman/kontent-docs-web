const express = require('express');
const asyncHandler = require('express-async-handler');
const router = express.Router();
const { check, validationResult } = require('express-validator/check');

const requestDelivery = require('../helpers/requestDelivery');
const minify = require('../helpers/minify');
const isPreview = require('../helpers/isPreview');
const commonContent = require('../helpers/commonContent');
const helper = require('../helpers/helperFunctions');
const recaptcha = require('../helpers/recaptcha');
const jira = require('../helpers/jira');
const handleCache = require('../helpers/handleCache');

const moment = require('moment');
const cache = require('memory-cache');
let cookiesPlatform;

const getSubNavigation = async (res, slug) => {
    return await handleCache.evaluateSingle(res, `subNavigation_${slug}`, async () => {
        return await requestDelivery({
            type: 'navigation_item',
            depth: 3,
            slug: slug,
            ...commonContent.getKCDetails(res)
        });
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
        settings.type = 'scenario';
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
        cacheKey = `${settings.type[0]}_${settings.slug}_${KCDetails.projectid}`;
    } else {
        cacheKey = `${settings.type}_${settings.slug}_${KCDetails.projectid}`;
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

const getSelectedPlatform = (platformsConfig, cookiesPlatform) => {
    let platform = platformsConfig ? platformsConfig.filter(item => item.system.codename === cookiesPlatform) : null;
    if (platform && platform.length) {
        platform = platform[0].elements.url.value
    } else {
        platform = null;
    }
    return platform;
};

const getPlatformsConfig = (projectId) =>
    cache.get(`platformsConfig_${projectId}`) && cache.get(`platformsConfig_${projectId}`).length
    ? cache.get(`platformsConfig_${projectId}`)[0].options
    : null;

const getPreselectedPlatform = (content, req, res) => {
    const KCDetails = commonContent.getKCDetails(res);
    const platformsConfig = getPlatformsConfig(KCDetails.projectid);

    let preselectedPlatform = req.query.tech;
    if (preselectedPlatform) {
        let tempPlatforms = platformsConfig ? platformsConfig.filter(item => item.elements.url.value === preselectedPlatform) : null;
        if (tempPlatforms && tempPlatforms.length) {
            preselectedPlatform = tempPlatforms[0].system.codename;
            res.cookie('KCDOCS.preselectedLanguage', preselectedPlatform);
            cookiesPlatform = preselectedPlatform;
        } else {
            return null;
        };
    }

    if (!preselectedPlatform) {
        preselectedPlatform = req.cookies['KCDOCS.preselectedLanguage'];
    }

    if (!preselectedPlatform) {
        if (content.children && content.children.length) {
            preselectedPlatform = content.children[0].elements.platform.value[0].codename;
        } else if (content.platform && content.platform.value.length) {
            preselectedPlatform = content.platform.value[0].codename;
        }
    } else {
        let platformItems;
        if (content.children) {
            platformItems = content.children.filter(item => {
                if (item.platform.value.length) {
                    return item.platform.value[0].codename === preselectedPlatform;
                }
                return false;
            });

            if (platformItems.length) {
                preselectedPlatform = platformItems[0].platform.value[0].codename;
            } else {
                preselectedPlatform = content.children[0].platform.value[0].codename;
            }
        } else {
            platformItems = content.platform.value.filter(item => item.codename === preselectedPlatform);

            if (platformItems.length) {
                preselectedPlatform = platformItems[0].codename;
            } else {
                if (content.platform.value.length) {
                    preselectedPlatform = content.platform.value[0].codename;
                }
            }
        }
    }

    return preselectedPlatform;
};

const getCanonicalUrl = (urlMap, content, preselectedPlatform) => {
    let canonicalUrl;
    if ((content.system.type === 'article' && content.platform.value.length > 1) || (content.system.type === 'multiplatform_article' && content.children.length && preselectedPlatform === content.children[0].platform.value[0].codename)) {
        canonicalUrl = urlMap.filter(item => item.codename === content.system.codename);
        canonicalUrl = canonicalUrl.length ? canonicalUrl[0].url : null;
    }
    return canonicalUrl;
};

const getContent = async (req, res) => {
    const KCDetails = commonContent.getKCDetails(res);
    const urlMap = cache.get(`urlMap_${KCDetails.projectid}`);
    const home = cache.get(`home_${KCDetails.projectid}`);
    const slug = req.originalUrl.split('/')[1];
    const subNavigation = await getSubNavigation(res, slug);
    const subNavigationLevels = getSubNavigationLevels(req);
    const currentLevel = getCurrentLevel(subNavigationLevels);
    const footer = cache.get(`footer_${KCDetails.projectid}`);
    const UIMessages = cache.get(`UIMessages_${KCDetails.projectid}`);
    let content = await getContentLevel(currentLevel, urlMap, req, res);
    let view = 'tutorials/pages/article';
    let availablePlatforms;

    let queryHash = req.url.split('?')[1];
    const platformsConfig = getPlatformsConfig(KCDetails.projectid);
    let preselectedPlatform;
    let canonicalUrl;
    cookiesPlatform = req.cookies['KCDOCS.preselectedLanguage'];

    if (content[0]) {
        if (currentLevel === -1) {
            return `/${slug}/${content[0].children[0].url.value}${queryHash ? '?' + queryHash : ''}`;
        } else if (currentLevel === 0) {
            view = 'tutorials/pages/scenario';
        } else if (currentLevel === 1) {
            return `/${slug}/${subNavigationLevels[currentLevel - 1]}/${subNavigationLevels[currentLevel]}/${content[0].children[0].url.value}${queryHash ? '?' + queryHash : ''}`;
        } else if (currentLevel === 2) {
            preselectedPlatform = getPreselectedPlatform(content[0], req, res);
            canonicalUrl = getCanonicalUrl(urlMap, content[0], preselectedPlatform);

            if (content[0].system.type === 'multiplatform_article') {
                let platformItem = content[0].children.filter(item => {
                    if (item.platform.value.length) {
                        return item.platform.value[0].codename === preselectedPlatform;
                    }
                    return false;
                });

                availablePlatforms = content[0].children;

                content = await handleCache.evaluateSingle(res, `article_${platformItem[0].elements.url.value}`, async () => {
                    return await requestDelivery({
                        codename: platformItem[0].system.codename,
                        type: 'article',
                        depth: 2,
                        resolveRichText: true,
                        urlMap: urlMap,
                        ...KCDetails
                    });
                });
            }

            preselectedPlatform = platformsConfig ? platformsConfig.filter(item => item.system.codename === preselectedPlatform) : null;
            if (preselectedPlatform && preselectedPlatform.length) {
                preselectedPlatform = preselectedPlatform[0].elements.url.value;
            } else {
                preselectedPlatform = null;
            }
        }
    } else {
        return null;
    }

    // If only article url slug in passed and item is present in the navigation, do not render the article
    let isIncludedNavigation = urlMap.filter(item => item.codename === content[0].system.codename).length > 0;
    if (!req.params.scenario && !req.params.topic && req.params.article && isIncludedNavigation) {
        return null;
    }

    return {
        view: view,
        req: req,
        res: res,
        moment: moment,
        minify: minify,
        slug: content[0] ? content[0].url.value : '',
        isPreview: isPreview(res.locals.previewapikey),
        projectId: res.locals.projectid,
        title: content[0].title.value,
        titleSuffix: ` | ${home[0] ? home[0].title.value : 'Kentico Cloud Docs'}`,
        description: content[0].introduction ? helper.stripTags(content[0].introduction.value).substring(0, 300) : '',
        platform: content[0].platform && content[0].platform.value.length ? await commonContent.normalizePlatforms(content[0].platform.value, res) : null,
        availablePlatforms: await commonContent.normalizePlatforms(availablePlatforms, res),
        selectedPlatform: getSelectedPlatform(platformsConfig, cookiesPlatform),
        canonicalUrl: canonicalUrl,
        introduction: content[0].introduction ? content[0].introduction.value : null,
        nextSteps: content[0].next_steps ? content[0].next_steps : '',
        navigation: home[0] ? home[0].navigation : [],
        subNavigation: subNavigation[0] ? subNavigation[0].children : [],
        subNavigationLevels: subNavigationLevels,
        content: content[0],
        footer: footer[0] ? footer[0] : {},
        UIMessages: UIMessages[0],
        helper: helper,
        getFormValue: helper.getFormValue,
        preselectedPlatform: preselectedPlatform
    };
};

router.get(['/other/:article', '/:main', '/:main/:scenario', '/:main/:scenario/:topic', '/:main/:scenario/:topic/:article'], asyncHandler(async (req, res, next) => {
    let data = await getContent(req, res, next);
    if (data && !data.view) return res.redirect(301, data);
    if (!data) return next();

    return res.render(data.view, data);
}));

router.post(['/other/:article', '/:main/:scenario', '/:main/:scenario/:topic/:article'], [
    check('feedback').not().isEmpty().withMessage((value, { req, location, path }) => {
        return 'feedback_form___empty_field_validation';
    }).trim()
], asyncHandler(async (req, res, next) => {
    let data = await getContent(req, res, next);
    if (!data) return next();
    data.req.formPosted = true;
    const errors = validationResult(req);

    if (errors.isEmpty()) {
        let isRealUser = await recaptcha.checkv2(req.body);

        if (isRealUser) {
            delete req.body['g-recaptcha-response'];
            data.req.successForm = true;
            req.body.url = req.protocol + '://' + req.get('host') + req.originalUrl;
            await jira.createIssue(req.body);
        } else {
            data.req.isBot = true;
        }
    } else {
        data.req.errorForm = helper.getValidationMessages(errors.array(), data.UIMessages);
    }

    data.req.anchor = 'feedback-form';
    return res.render(data.view, data);
}));

module.exports = router;
