const requestDelivery = require('../helpers/requestDelivery');

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
    orderPlatforms: (platforms) => {
        if (platforms) {
            let order = ['rest', '_net', 'javascript', 'typescript', 'java', 'android', 'ios', 'php', 'ruby'];
            let result = [];

            order.forEach(orderItem => {
                platforms.forEach(platformItem => {
                    let codename = platformItem.codename || platformItem.platform.value[0].codename;
                    if (orderItem === codename) {
                        result.push(platformItem);
                    }
                });
            });

            return result;
        }

        return platforms;
    }
}

module.exports = commonContent;
