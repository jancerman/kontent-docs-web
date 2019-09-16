const requestDelivery = require('./requestDelivery');
const cache = require('memory-cache');

const commonContent = {
    getKCDetails: (res) => {
        return {
            projectid: res.locals.projectid,
            previewapikey: res.locals.previewapikey,
            securedapikey: res.locals.securedapikey
        };
    },
    getTree: async (contentType, depth, res) => {
        const KCDetails = commonContent.getKCDetails(res);
        return await requestDelivery({
            type: contentType,
            depth: depth,
            resolveRichText: true,
            urlMap: cache.get(`urlMap_${KCDetails.projectid}`),
            ...KCDetails
        });
    },
    getFooter: async (res) => {
        return await requestDelivery({
            type: 'footer',
            ...commonContent.getKCDetails(res)
        });
    },
    getSubNavigation: async (res, slug) => {
        return await requestDelivery({
            type: 'navigation_item',
            depth: 3,
            slug: slug,
            ...commonContent.getKCDetails(res)
        });
    },
    getUIMessages: async (res) => {
        return await requestDelivery({
            type: 'ui_messages',
            resolveRichText: true,
            ...commonContent.getKCDetails(res)
        });
    },
    getHome: async (res) => {
        const KCDetails = commonContent.getKCDetails(res);
        return await requestDelivery({
            type: 'home',
            depth: 4,
            resolveRichText: true,
            urlMap: cache.get(`urlMap_${KCDetails.projectid}`),
            ...KCDetails
        });
    },
    getArticles: async (res) => {
        return await requestDelivery({
            type: 'article',
            ...commonContent.getKCDetails(res)
        });
    },
    getRSSArticles: async (res) => {
        return await requestDelivery({
            type: 'article',
            limit: 20,
            order: {
                type: 'descending',
                field: 'system.last_modified'
            },
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
        return await requestDelivery({
            type: 'not_found',
            resolveRichText: true,
            urlMap: cache.get(`urlMap_${KCDetails.projectid}`),
            ...KCDetails
        });
    },
    getNavigationItems: async (res) => {
        return await requestDelivery({
            type: 'navigation_item',
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
    getPlatformsConfigPairings: (res) => {
        const KCDetails = commonContent.getKCDetails(res);
        let cachedPlatforms = cache.get(`platformsConfig_${KCDetails.projectid}`);
        let pairings = [];

        cachedPlatforms[0].options.forEach((item) => {
            if (item.url.value !== item.platform.value[0].codename) {
                pairings.push({
                    url: item.url.value,
                    platform: item.platform.value[0].codename
                });
            }
        });

        return pairings;
    },
    normalizePlatforms: async (platforms, res) => {
        const KCDetails = commonContent.getKCDetails(res);

        let result = [];
        let order = [];
        let cachedPlatforms = cache.get(`platformsConfig_${KCDetails.projectid}`);

        if (!cachedPlatforms) {
            cachedPlatforms = await commonContent.getPlatformsConfig(res);
        }

        if (platforms && cachedPlatforms && cachedPlatforms.length) {
            cachedPlatforms[0].options.forEach((item) => {
                let platform = {
                    title: item.title.value,
                    slug: item.url.value,
                    codename: item.platform.value[0].codename
                }
                order.push(platform);
            });

            order.forEach(orderItem => {
                platforms.forEach(platformItem => {
                    let codenameTemp = platformItem.platform && platformItem.platform.value.length ? platformItem.platform.value[0].codename : null;
                    let codename = platformItem.codename || codenameTemp;
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
