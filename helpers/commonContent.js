const requestDelivery = require('../helpers/requestDelivery');

const commonContent = {
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
            projectid: res.locals.projectid,
            previewapikey: res.locals.previewapikey
        });
    }
}

module.exports = commonContent;
