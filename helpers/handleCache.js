const cache = require('memory-cache');
const axios = require('axios');
const consola = require('consola');
const getUrlMap = require('./urlMap');
const commonContent = require('./commonContent');
const helper = require('../helpers/helperFunctions');
const isPreview = require('../helpers/isPreview');

const deleteCachePreviewCheck = (keyName, KCDetails, isPreviewRequest) => {
    if (isPreviewRequest && cache.get(`${keyName}_${KCDetails.projectid}`)) {
        cache.del(`${keyName}_${KCDetails.projectid}`);
    }
};

const deleteCache = (keyName, KCDetails) => {
    cache.del(`${keyName}_${KCDetails.projectid}`);
};

const deleteMultipleKeys = (startsWithString, keys) => {
    if (!keys) {
        keys = cache.keys();
    }

    for (let i = 0; i < keys.length; i++) {
        if (keys[i].startsWith(startsWithString)) {
            cache.del(keys[i]);
        }
    }
};

const getCache = (keyName, KCDetails) => {
    return cache.get(`${keyName}_${KCDetails.projectid}`);
};

const putCache = (keyName, data, KCDetails) => {
    cache.put(`${keyName}_${KCDetails.projectid}`, data);
};

const manageCache = async (keyName, dataRetrieval, KCDetails, isPreviewRequest, res) => {
    deleteCachePreviewCheck(keyName, KCDetails, isPreviewRequest);
    if (!getCache(keyName, KCDetails)) {
        const data = await dataRetrieval(res);
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
        name: 'scenarios',
        method: commonContent.getScenarios
    }, {
        name: 'notFound',
        method: commonContent.getNotFound
    }, {
        name: 'navigationItems',
        method: commonContent.getNavigationItems
    }, {
        name: 'apiSpecifications',
        method: commonContent.getReferences
    }, {
        name: 'releaseNotes',
        method: commonContent.getReleaseNotes
    }, {
        name: 'redirectRules',
        method: commonContent.getRedirectRules
    }, {
        name: 'termDefinitions',
        method: commonContent.getTermDefinitions
    }
];

const evaluateCommon = async (res, keysTohandle) => {
    const KCDetails = commonContent.getKCDetails(res);
    const processCache = async (array) => {
        for await (const item of array) {
            if (keysTohandle.indexOf(item.name) > -1) {
                await manageCache(item.name, async (res) => {
                    return await item.method(res);
                }, KCDetails, KCDetails.isPreview, res);
            }
        }
        return null;
    }
    return await processCache(cacheKeys);
};

const evaluateSingle = async (res, keyName, method) => {
    const KCDetails = commonContent.getKCDetails(res);
    return await manageCache(keyName, async (res) => {
        return await method(res);
    }, KCDetails, KCDetails.isPreview);
};

const ensureSingle = async (res, keyName, method) => {
    const KCDetails = commonContent.getKCDetails(res);

    if (!getCache(keyName, KCDetails)) {
        const data = await method(res);
        putCache(keyName, data, KCDetails);
    }
    return getCache(keyName, KCDetails);
};

const cacheAllAPIReferences = async (res) => {
    const KCDetails = commonContent.getKCDetails(res);
    const provideReferences = async (apiCodename, KCDetails) => {
        await helper.getReferenceFiles(apiCodename, true, KCDetails, 'cacheAllAPIReferences');
    };
    const keys = cache.keys();
    let references;
    if (!(keys.filter(item => item.indexOf('reDocReference_') > -1).length) && !KCDetails.isPreview) {
        references = await evaluateSingle(res, 'apiSpecifications', async () => {
            return commonContent.getReferences(res);
        });

        if (references && references.length) {
            for (const value of references) {
                provideReferences(value.system.codename, KCDetails)
            }
        }
    }
};

const axiosFastlySoftPurge = async (url) => {
    try {
        await axios({
            method: 'purge',
            url: url,
            headers: {
                'Fastly-Soft-Purge': '1'
            }
        });
    } catch (error) {
        consola.error(error && error.response ? error.response.data : '');
    }
};

const sendFastlySoftPurge = async (key, res) => {
    if (isPreview(res.locals.previewapikey)) return;

    const urlMap = await ensureSingle(res, 'urlMap', async () => {
        return await getUrlMap(res);
    });

    for (let i = 0; i < urlMap.length; i++) {
        if (urlMap[i].codename === key) {
            const domain = process.env.baseURL.split('://');
            if (domain[1]) {
                await axiosFastlySoftPurge(`${helper.getDomain(domain[0], domain[1])}${urlMap[i].url}`);
            }
        }
    }
};

module.exports = {
    evaluateCommon,
    evaluateSingle,
    cacheAllAPIReferences,
    getCache,
    putCache,
    deleteCache,
    deleteMultipleKeys,
    ensureSingle,
    sendFastlySoftPurge,
    axiosFastlySoftPurge
};
