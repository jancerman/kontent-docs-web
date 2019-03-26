const requestDelivery = require('../helpers/requestDelivery');
const cache = require('memory-cache');

const commonContent = {
    getKCDetails: (res) => {
        return {
            projectid: res.locals.projectid,
            previewapikey: res.locals.previewapikey,
            securedapikey: res.locals.securedapikey
        };
    },
    getFooter: async (res) => {
        return await requestDelivery({
            type: 'footer',
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
    getPlatformsConfig: async (res) => {
        return await requestDelivery({
            type: 'platform_picker',
            codename: 'platform_picker',
            ...commonContent.getKCDetails(res)
        });
    },
    normalizePlatforms: (platforms) => {
        let result = [];
        let order = [];  
        const cachedPlatforms = cache.get('platformsConfig');
        
        if (platforms && cachedPlatforms) {
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
                    let codename = platformItem.codename || platformItem.platform.value[0].codename;
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
