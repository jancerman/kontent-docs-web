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

const moment = require('moment');
const cache = require('memory-cache');
let cookiesPlatform;

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
    }

    return await requestDelivery(settings);
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

const getPreselectedPlatform = (content, req, res) => {
    const platformsConfig = cache.get('platformsConfig') && cache.get('platformsConfig').length ? cache.get('platformsConfig')[0].options : null;

    let preselectedPlatform = req.query.lang;
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
            platformItems = content.children.filter(item => item.platform.value[0].codename === preselectedPlatform);

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
    if (content.system.type === 'article' || (content.system.type === 'multiplatform_article' && content.children.length && preselectedPlatform === content.children[0].platform.value[0].codename)) {
        canonicalUrl = urlMap.filter(item => item.codename === content.system.codename);
        canonicalUrl = canonicalUrl.length ? canonicalUrl[0].url : null;
    }
    return canonicalUrl;
};

const getContent = async (req, res) => {
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
    let view = 'tutorials/pages/article';
    let availablePlatforms;

    let queryHash = req.url.split('?')[1];
    const platformsConfig = cache.get('platformsConfig') && cache.get('platformsConfig').length ? cache.get('platformsConfig')[0].options : null;
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
        titleSuffix: ` | ${navigation[0] ? navigation[0].title.value : 'Kentico Cloud Docs'}`,
        description: content[0].introduction ? helper.stripTags(content[0].introduction.value).substring(0, 300) : '',
        platform: content[0].platform && content[0].platform.value.length ? commonContent.normalizePlatforms(content[0].platform.value) : null,
        availablePlatforms: commonContent.normalizePlatforms(availablePlatforms),
        selectedPlatform: getSelectedPlatform(platformsConfig, cookiesPlatform),
        canonicalUrl: canonicalUrl,
        introduction: content[0].introduction ? content[0].introduction.value : null,
        nextSteps: content[0].next_steps ? content[0].next_steps : '',
        navigation: navigation[0] ? navigation[0].navigation : [],
        subNavigation: subNavigation[0] ? subNavigation[0].children : [],
        subNavigationLevels: subNavigationLevels,
        content: content[0],
        footer: footer[0] ? footer[0] : {},
        UIMessages: UIMessages[0],
        helper: helper,
        getFormValue: helper.getFormValue
    };
};

router.get(['/tutorials', '/tutorials/:scenario', '/tutorials/:scenario/:topic', '/tutorials/:scenario/:topic/:article', '/tutorials/:scenario/:topic/:article', '/other/:article', '/whats-new', '/whats-new/:scenario', '/whats-new/:scenario/:topic', '/whats-new/:scenario/:topic/:article'], asyncHandler(async (req, res, next) => {
    let data = await getContent(req, res, next);

    if (data && !data.view) return res.redirect(301, data);
    if (!data) return next();

    return res.render(data.view, data);
}));

router.post(['/tutorials/:scenario', '/tutorials/:scenario/:topic/:article', '/other/:article', '/whats-new/:scenario', '/whats-new/:scenario/:topic/:article'], [
    check('feedback').not().isEmpty().withMessage((value, { req, location, path }) => {
        return 'feedback_form___empty_field_validation';
    }).trim()
], asyncHandler(async (req, res, next) => {
    let data = await getContent(req, res, next);
    if (!data) return next();
    data.req.formPosted = true;
    const errors = validationResult(req);

    if (errors.isEmpty()) {
        let isRealUser = await recaptcha.check(req.body);

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
