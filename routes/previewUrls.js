const express = require('express');
const asyncHandler = require('express-async-handler');
const router = express.Router();
const getUrlMap = require('../helpers/urlMap');
const commonContent = require('../helpers/commonContent');
const requestDelivery = require('../helpers/requestDelivery');

const getType = (params) => {
    let type = '';
    if (params.article) {
        type = 'article';
    } else if (params.scenario) {
        type = 'scenario';
    }
    return type;
};

const getItem = async (res, type, slug) => {
    const KCDetails = commonContent.getKCDetails(res);
    return await requestDelivery({
        type: type,
        slug: slug,
        ...KCDetails
    });
};

router.get(['/article/:article', '/scenario/:scenario'], asyncHandler(async (req, res, next) => {
    const KCDetails = commonContent.getKCDetails(res);
    const urlMap = await getUrlMap(KCDetails);
    const type = getType(req.params);
    const urlSlug = req.params.article || req.params.scenario;
    let item = await getItem(res, type, urlSlug);
    const redirectUrl = urlMap.filter(url => {
        return url.codename === item[0].system.codename;
    });
    if (redirectUrl.length) {
        return res.redirect(301, redirectUrl[0].url);
    }
    if (type === 'article') {
        return res.redirect(301, `/other/${urlSlug}`);
    }
    return next();
}));

module.exports = router;