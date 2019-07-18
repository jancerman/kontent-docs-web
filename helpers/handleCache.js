const cache = require('memory-cache');
const getUrlMap = require('./urlMap');
const commonContent = require('./commonContent');
const isPreview = require('./isPreview');

let KCDetails;
let isPreviewRequest;

const deleteCache = (keyName) => {
    if (isPreviewRequest && cache.get(`${keyName}_${KCDetails.projectid}`)) {
        cache.del(`${keyName}_${KCDetails.projectid}`);
    }
};

const getCache = (keyName) => {
    return cache.get(`${keyName}_${KCDetails.projectid}`);
};

const putCache = (keyName, data) => {
    cache.put(`${keyName}_${KCDetails.projectid}`, data);
};

const manageCache = async (keyName, dataRetrieval) => {
    deleteCache(keyName);
    if (!getCache(keyName)) {
        const data = await dataRetrieval();
        putCache(keyName, data);
    }
    return getCache(keyName);
};

const cacheKeys = [{
        name: 'platformsConfig',
        method: commonContent.getPlatformsConfig
    }, {
        name: 'urlMap',
        method: getUrlMap
    }, {
        name: 'footer',
        method: commonContent.getFooter
    }, {
        name: 'UIMessages',
        method: commonContent.getUIMessages
    }, {
        name: 'home',
        method: commonContent.getHome
    }, {
        name: 'articles',
        method: commonContent.getArticles
    }, {
        name: 'rss_articles',
        method: commonContent.getRSSArticles
    }, {
        name: 'not_found',
        method: commonContent.getNotFound
    }
];

const evaluateCommon = async (res, keysTohandle) => {
    KCDetails = commonContent.getKCDetails(res);
    isPreviewRequest = isPreview(res.locals.previewapikey);

    const processCache = async (array) => {
        for (const item of array) {
            if (keysTohandle.indexOf(item.name) > -1) {
                await manageCache(item.name, async () => {
                    return await item.method(res);
                });
            }
        }
    }

    await processCache(cacheKeys);
};

const evaluateSingle = async (res, keyName, method) => {
    return await manageCache(keyName, async () => {
        return await method(res);
    });
};

module.exports = {
    evaluateCommon,
    evaluateSingle,
    KCDetails
}
