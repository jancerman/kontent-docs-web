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
            projectid: res.locals.projectid,
            previewapikey: res.locals.previewapikey
        });
    },
    getUIMessages: async (res) => {
        return await requestDelivery({
            type: 'ui_messages',
            resolveRichText: true,
            projectid: res.locals.projectid,
            previewapikey: res.locals.previewapikey
        });
    }
}

module.exports = commonContent;
