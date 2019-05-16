const asyncHandler = require('express-async-handler');
const cache = require('memory-cache');

const requestDelivery = require('../helpers/requestDelivery');
const commonContent = require('../helpers/commonContent');

const getArticles = async (res) => {
    const KCDetails = commonContent.getKCDetails(res);

    return await requestDelivery({
        type: 'article',
        ...KCDetails
    });
};

const urlAliases = asyncHandler(async (req, res, next) => {
    const KCDetails = commonContent.getKCDetails(res);

    const urlSplit = req.originalUrl.split('?');
    const queryParamater = urlSplit[1] ? urlSplit[1] : '';
    const originalUrl = urlSplit[0].trim().toLowerCase().replace(/\/\s*$/, '');
    const articles = await getArticles(res);
    const urlMap = cache.get(`urlMap_${KCDetails.projectid}`);
    let redirectUrl = [];

    articles.forEach(item => {
        const aliases = item.redirect_urls.value.trim().split(';');
        aliases.forEach(alias => {
            alias = alias.trim().toLowerCase().replace(/\/\s*$/, '');
            if (alias === originalUrl) {
                redirectUrl = urlMap.filter(url => {
                    return url.codename === item.system.codename;
                });
            }
        });
    });

    if (redirectUrl.length) {
        return res.redirect(301, `${redirectUrl[0].url}${queryParamater ? '?' + queryParamater : ''}`);
    } else {
        const err = new Error('Not Found');
        err.status = 404;
        return next(err);
    }
});

module.exports = urlAliases;
