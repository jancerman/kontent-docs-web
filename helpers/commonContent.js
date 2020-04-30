const requestDelivery = require('./requestDelivery');
const getUrlMap = require('./urlMap');
const ensureSingle = require('./ensureSingle');
const isPreview = require('../helpers/isPreview');
const richTextResolverTemplates = require('./richTextResolverTemplates');

const commonContent = {
    getKCDetails: (res) => {
        return {
            projectid: res.locals.projectid,
            previewapikey: res.locals.previewapikey,
            securedapikey: res.locals.securedapikey,
            host: res.locals.host,
            protocol: res.locals.protocol,
            isPreview: isPreview(res.locals.previewapikey),
        };
    },
    getTree: async (contentType, depth, res) => {
        const KCDetails = commonContent.getKCDetails(res);
        const urlMap = await ensureSingle(res, 'urlMap', async () => {
            return await getUrlMap(res);
        });
        return await requestDelivery({
            type: contentType,
            depth: depth,
            resolveRichText: true,
            urlMap: urlMap,
            ...KCDetails
        });
    },
    getFooter: async (res) => {
        return await requestDelivery({
            type: 'footer',
            ...commonContent.getKCDetails(res)
        });
    },
    getSubNavigation: async (res, codename) => {
        return await requestDelivery({
            type: 'navigation_item',
            depth: 3,
            codename: codename,
            ...commonContent.getKCDetails(res)
        });
    },
    getUIMessages: async (res) => {
        const urlMap = await ensureSingle(res, 'urlMap', async () => {
            return await getUrlMap(res);
        });
        return await requestDelivery({
            type: 'ui_messages',
            resolveRichText: true,
            urlMap: urlMap,
            ...commonContent.getKCDetails(res)
        });
    },
    getHome: async (res) => {
        const KCDetails = commonContent.getKCDetails(res);
        const urlMap = await ensureSingle(res, 'urlMap', async () => {
            return await getUrlMap(res);
        });
        return await requestDelivery({
            type: 'home',
            depth: 4,
            resolveRichText: true,
            urlMap: urlMap,
            ...KCDetails
        });
    },
    getArticles: async (res) => {
        return await requestDelivery({
            type: ['article', 'multiplatform_article'],
            ...commonContent.getKCDetails(res)
        });
    },
    getRSSChangelog: async (res) => {
        const urlMap = await ensureSingle(res, 'urlMap', async () => {
            return await getUrlMap(res);
        });

        const baseUrl = urlMap.filter((item) => { return item.codename === 'product_changelog' });

        return await requestDelivery({
            codename: 'product_changelog',
            urlMap: urlMap,
            resolveRichText: true,
            richTextResolvers: [{
                type: 'release_note',
                resolver: richTextResolverTemplates.releaseNoteRSS,
                custom: baseUrl.length ? baseUrl[0] : null
            }],
            ...commonContent.getKCDetails(res)
        });
    },
    getCertification: async (res) => {
        return await requestDelivery({
            type: 'certification',
            ...commonContent.getKCDetails(res)
        });
    },
    getNotFound: async (res) => {
        const KCDetails = commonContent.getKCDetails(res);
        const urlMap = await ensureSingle(res, 'urlMap', async () => {
            return await getUrlMap(res);
        });
        return await requestDelivery({
            type: 'not_found',
            resolveRichText: true,
            urlMap: urlMap,
            ...KCDetails
        });
    },
    getNavigationItems: async (res) => {
        return await requestDelivery({
            type: 'navigation_item',
            ...commonContent.getKCDetails(res)
        });
    },
    getReferences: async (res) => {
        return await requestDelivery({
            type: 'zapi_specification',
            ...commonContent.getKCDetails(res)
        });
    },
    getRedirectRules: async (res) => {
        return await requestDelivery({
            type: 'redirect_rule',
            ...commonContent.getKCDetails(res)
        });
    },
    getReleaseNoteType: async (res) => {
        return await requestDelivery({
            data: 'type',
            type: 'release_note',
            ...commonContent.getKCDetails(res)
        });
    },
    getPlatformsConfig: async (res) => {
        return await requestDelivery({
            type: 'platform_picker',
            codename: 'platform_picker',
            ...commonContent.getKCDetails(res)
        });
    },
    getPlatformsConfigPairings: async (res) => {
        const cachedPlatforms = await ensureSingle(res, 'platformsConfig', async () => {
            return await commonContent.getPlatformsConfig(res);
        });
        const pairings = [];

        if (cachedPlatforms && cachedPlatforms.length) {
            cachedPlatforms[0].options.value.forEach((item) => {
                if (item.url.value !== item.platform.value[0].codename) {
                    pairings.push({
                        url: item.url.value,
                        platform: item.platform.value[0].codename
                    });
                }
            });
        }

        return pairings;
    },
    normalizePlatforms: async (platforms, res) => {
        const result = [];
        const order = [];
        let cachedPlatforms = await ensureSingle(res, 'platformsConfig', async () => {
            return await commonContent.getPlatformsConfig(res);
        });

        if (!cachedPlatforms) {
            cachedPlatforms = await commonContent.getPlatformsConfig(res);
        }

        if (platforms && cachedPlatforms && cachedPlatforms.length) {
            cachedPlatforms[0].options.value.forEach((item) => {
                const platform = {
                    title: item.title.value,
                    slug: item.url.value,
                    codename: item.platform.value[0].codename,
                    icon: item.icon.value.length ? `${item.icon.value[0].url}?w=20` : ''
                }
                order.push(platform);
            });

            if (platforms.value) {
                platforms = platforms.value;
            }

            order.forEach(orderItem => {
                platforms.forEach(platformItem => {
                    const codenameTemp = platformItem.platform && platformItem.platform.value.length ? platformItem.platform.value[0].codename : null;
                    const codename = platformItem.codename || codenameTemp;
                    if (orderItem.codename === codename) {
                        result.push(orderItem);
                    }
                });
            });
        }

        return result;
    }
}

module.exports = commonContent;
