const cache = require('memory-cache');
const getUrlMap = require('./urlMap');
const commonContent = require('./commonContent');
const isPreview = require('./isPreview');
const requestDelivery = require('./requestDelivery');
const axios = require('axios');

const deleteCache = (keyName, KCDetails, isPreviewRequest) => {
    if (isPreviewRequest && cache.get(`${keyName}_${KCDetails.projectid}`)) {
        cache.del(`${keyName}_${KCDetails.projectid}`);
    }
};

const getCache = (keyName, KCDetails) => {
    return cache.get(`${keyName}_${KCDetails.projectid}`);
};

const putCache = (keyName, data, KCDetails) => {
    cache.put(`${keyName}_${KCDetails.projectid}`, data);
};

const manageCache = async (keyName, dataRetrieval, KCDetails, isPreviewRequest) => {
    deleteCache(keyName, KCDetails, isPreviewRequest);
    if (!getCache(keyName, KCDetails)) {
        const data = await dataRetrieval();
        putCache(keyName, data, KCDetails);
    }
    return getCache(keyName, KCDetails);
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
    }, {
        name: 'navigationItems',
        method: commonContent.getNavigationItems
    }
];

const evaluateCommon = async (res, keysTohandle) => {
    const KCDetails = commonContent.getKCDetails(res);
    const isPreviewRequest = isPreview(res.locals.previewapikey);

    const processCache = async (array) => {
        for await (const item of array) {
            if (keysTohandle.indexOf(item.name) > -1) {
                await manageCache(item.name, async () => {
                    return await item.method(res);
                }, KCDetails, isPreviewRequest);
            }
        }
    }

    await processCache(cacheKeys);
};

const evaluateSingle = async (res, keyName, method) => {
    const KCDetails = commonContent.getKCDetails(res);
    const isPreviewRequest = isPreview(res.locals.previewapikey);

    return await manageCache(keyName, async () => {
        return await method(res);
    }, KCDetails, isPreviewRequest);
};

const cacheAllAPIReferences = async (res) => {
    const KCDetails = commonContent.getKCDetails(res);
    const getReferences = async () => {
        return await requestDelivery({
            type: 'zapi_specification',
            ...KCDetails
        });
    };

    const isPreviewRequest = isPreview(res.locals.previewapikey);
    const keys = cache.keys();
    let references;

    if (!(keys.filter(item => item.indexOf('reDocReference_') > -1).length) && !isPreviewRequest) {
        references = await getReferences();

        let baseURL = process.env['referenceRenderUrl'];

        for await (const value of references) {
            const data = await axios.get(`${baseURL}/api/ProviderStarter?api=${value.system.codename}&isPreview=${isPreviewRequest}`);
            cache.put(`reDocReference_${value.system.codename}`, data);
        }
    }
};

module.exports = {
    evaluateCommon,
    evaluateSingle,
    cacheAllAPIReferences
}
