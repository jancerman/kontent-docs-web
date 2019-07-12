const express = require('express');
const asyncHandler = require('express-async-handler');
const router = express.Router();
const cache = require('memory-cache');
const moment = require('moment');
const cmd = require('node-cmd');

const getUrlMap = require('../helpers/urlMap');
const commonContent = require('../helpers/commonContent');
const handleCache = require('../helpers/handleCache');
const requestDelivery = require('../helpers/requestDelivery');
const helper = require('../helpers/helperFunctions');
const isPreview = require('../helpers/isPreview');
const minify = require('../helpers/minify');
const prerenderOptions = require('../helpers/redoc-cli/prerender-options.js');

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

router.get('/', asyncHandler(async (req, res, next) => {
    const slug = req.originalUrl.split('/')[1];
    const subNavigation = await getSubNavigation(res, slug);
    let redirectSlug = '';

    if (subNavigation[0] && subNavigation[0].children[0] && subNavigation[0].children[0].url) {
        redirectSlug = subNavigation[0].children[0].url.value;
    }

    return res.redirect(301, `/${slug}/${redirectSlug}`);
}));

router.get('/:slug', asyncHandler(async (req, res, next) => {
    const KCDetails = commonContent.getKCDetails(res);
    const urlMap = await getUrlMap(res, true);
    const parentSlug = req.originalUrl.split('/')[1];
    const slug = req.params.slug;
    const home = cache.get(`home_${KCDetails.projectid}`);
    const footer = cache.get(`footer_${KCDetails.projectid}`);
    const UIMessages = cache.get(`UIMessages_${KCDetails.projectid}`);
    const subNavigation = await getSubNavigation(res, parentSlug);

    const content = await handleCache.evaluateSingle(res, `reference_${slug}_${KCDetails.projectid}`, async () => {
        return await requestDelivery({
            slug: slug,
            depth: 2,
            types: ['article', 'zapi_specification'],
            resolveRichText: true,
            urlMap: urlMap,
            ...KCDetails
        });
    });

    if (!urlMap[0]) {
        return next();
    }

    let view, data;

    if (content[0].system.type === 'zapi_specification') {
        view = 'apiReference/pages/redoc';
        data = {
            req: req,
            minify: minify,
            slug: slug,
            isPreview: isPreview(res.locals.previewapikey),
            title: content[0].title.value,
            titleSuffix: ` | ${home[0] ? home[0].title.value : 'Kentico Cloud Docs'}`,
            navigation: home[0].navigation,
            footer: footer[0] ? footer[0] : {},
            UIMessages: UIMessages[0],
            helper: helper
        };

        const prerender = () => {
            const yaml = 'https://gist.githubusercontent.com/jancerman/3ca7767279c8713fdfa7c45e94d655f2/raw/efbd64954fefa9edbda332027dac1b74c3d3bb49/kcd%2520proto%2520all%2520oas3.yml';
            const options = prerenderOptions.join(' ');
            const template = './views/apiReference/redoc/template.hbs';

            return cmd.get(
                `node ./helpers/redoc-cli/index.js bundle ${yaml} -t ${template} ${options}`,
                function () {
                    return renderPage();
                }
            );
        };

        const renderPage = () => {
            return res.render(view, data);
        };

        return prerender();
    } else {
        view = 'apiReference/pages/reference';
        data = {
            req: req,
            minify: minify,
            slug: slug,
            parentSlug: parentSlug,
            isPreview: isPreview(res.locals.previewapikey),
            title: content[0].title.value,
            titleSuffix: ` | ${home[0] ? home[0].title.value : 'Kentico Cloud Docs'}`,
            navigation: home[0].navigation,
            introduction: content[0].introduction ? content[0].introduction.value : null,
            nextSteps: content[0].next_steps ? content[0].next_steps : '',
            content: content[0],
            footer: footer[0] ? footer[0] : {},
            UIMessages: UIMessages[0],
            helper: helper,
            subNavigation: subNavigation[0] ? subNavigation[0].children : [],
            moment: moment
        };

        return res.render(view, data);
    }
}));

module.exports = router;
