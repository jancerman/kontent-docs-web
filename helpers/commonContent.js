const requestDelivery = require('../helpers/requestDelivery');

const commonContent = {
    getFooter: async (res) => {
        return await requestDelivery({
            type: 'footer',
            projectid: res.locals.projectid,
            previewapikey: res.locals.previewapikey
        });
    }
}

module.exports = commonContent;
