const cache = require('memory-cache');
const commonContent = require('../helpers/commonContent');
const requestDelivery = require('../helpers/requestDelivery');
const getRootCodenamesOfSingleItem = require('../helpers/rootItemsGetter');
const handleCache = require('../helpers/handleCache');
const app = require('../app');

const requestItemAndDeleteCacheKey = async (keyNameToDelete, codename, KCDetails) => {
    const urlMap = handleCache.getCache('urlMap', KCDetails);
    const item = await requestDelivery({
        codename: codename,
        depth: 2,
        resolveRichText: true,
        urlMap: urlMap,
        ...KCDetails
    });

    if (item && item.length) {
        if (!keyNameToDelete) {
            keyNameToDelete = item[0].system.type;
        }

        const key = `${keyNameToDelete}_${item[0].url.value}`;

        if (handleCache.getCache(key, KCDetails)) {
            handleCache.deleteCache(key, KCDetails);
            handleCache.putCache(key, item, KCDetails);
        }
    }
};

const deleteSpecificKeys = async (KCDetails, items, keyNameToDelete) => {
    for await (const item of items) {
        await requestItemAndDeleteCacheKey(keyNameToDelete, item.codename, KCDetails);
    }
};

const revalidateReleaseNoteType = async (KCDetails, res) => {
    const key = 'releaseNoteContentType';
    handleCache.deleteCache(key, KCDetails);
    const releaseNoteType = await commonContent.getReleaseNoteType(res);
    handleCache.putCache(key, releaseNoteType, KCDetails);
};

const splitPayloadByContentType = (items) => {
    const itemsByTypes = {
        footer: [],
        UIMessages: [],
        articles: [],
        scenarios: [],
        topics: [],
        notFound: [],
        picker: [],
        navigationItems: [],
        apiSpecifications: [],
        redirectRules: []
    };

    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type === 'footer') {
            itemsByTypes.footer.push(item);
        } else if (item.type === 'ui_messages') {
            itemsByTypes.UIMessages.push(item);
        } else if (item.type === 'article') {
            itemsByTypes.articles.push(item);
        } else if (item.type === 'scenario' || item.type === 'certification') {
            itemsByTypes.scenarios.push(item);
        } else if (item.type === 'topic') {
            itemsByTypes.topics.push(item);
        } else if (item.type === 'not_found') {
            itemsByTypes.notFound.push(item);
        } else if (item.type === 'platform_picker') {
            itemsByTypes.picker.push(item);
        } else if (item.type === 'navigation_item') {
            itemsByTypes.navigationItems.push(item);
        } else if (item.type === 'multiplatform_article') {
            itemsByTypes.articles.push(item);
            itemsByTypes.scenarios.push(item);
        } else if (item.type === 'zapi_specification') {
            itemsByTypes.apiSpecifications.push(item);
        } else if (item.type === 'redirect_rule') {
            itemsByTypes.redirectRules.push(item);
        }
    }

    return itemsByTypes;
};

const getRootItems = async (items, KCDetails) => {
    const typesToSearch = ['article', 'scenario', 'callout', 'content_chunk', 'code_sample', 'code_samples'];
    const allItems = await requestDelivery({
        types: typesToSearch,
        depth: 0,
        ...KCDetails
    });

    const rootCodenames = new Set();
    if (items && allItems) {
        items.forEach((item) => {
            const roots = getRootCodenamesOfSingleItem(item, allItems);
            roots.forEach(codename => rootCodenames.add(codename));
        });
    }

    return rootCodenames;
};

const invalidateRootItems = async (items, KCDetails) => {
    const rootItems = Array.from(await getRootItems(items, KCDetails));

    for await (const rootItem of rootItems) {
        await requestItemAndDeleteCacheKey(null, rootItem, KCDetails);
    }
};

const invalidateGeneral = async (itemsByTypes, KCDetails, res, type, keyName) => {
    if (!keyName) {
        keyName = type;
    }

    if (itemsByTypes[type].length) {
        handleCache.deleteCache(keyName, KCDetails);
        await handleCache.evaluateCommon(res, [keyName]);
    }

    return false;
};

const invalidateMultiple = async (itemsByTypes, KCDetails, type, keyName) => {
    if (!keyName) {
        keyName = type;
    }

    if (itemsByTypes[type].length) {
        itemsByTypes[type].forEach(async (item) => {
            await requestItemAndDeleteCacheKey(keyName, item.codename, KCDetails);
        });
    }

    return false;
};

const invalidateArticles = async (itemsByTypes, KCDetails, res) => {
    if (itemsByTypes.articles.length) {
        await revalidateReleaseNoteType(KCDetails, res);
        await deleteSpecificKeys(KCDetails, itemsByTypes.articles, 'article');
        await deleteSpecificKeys(KCDetails, itemsByTypes.articles, 'reference');
        handleCache.deleteCache('articles', KCDetails);
        handleCache.deleteCache('rss_articles', KCDetails);
        await handleCache.evaluateCommon(res, ['articles', 'rss_articles']);
    }

    return false;
};

const invalidateHome = async (res, KCDetails) => {
    handleCache.deleteCache('home', KCDetails);
    await handleCache.evaluateCommon(res, ['home']);
};

const invalidateUrlMap = async (res, KCDetails) => {
    handleCache.deleteCache('urlMap', KCDetails);
    await handleCache.evaluateCommon(res, ['urlMap']);
};

const invalidateSubNavigation = async (res, keys) => {
    let subNavigationKeys = keys.filter(key => key.startsWith('subNavigation_'));
    subNavigationKeys = subNavigationKeys.map(key => {
        key = key.split('_')[1];
        return key.split('?')[0];
    });
    handleCache.deleteMultipleKeys('subNavigation_', keys);

    for await (const slug of subNavigationKeys) {
        await handleCache.evaluateSingle(res, `subNavigation_${slug}`, async () => {
            return await commonContent.getSubNavigation(res, slug);
        });
    }
};

const processInvalidation = async (res) => {
    const items = cache.get('webhook-payload-pool') || [];
    if (items.length) {
        const KCDetails = commonContent.getKCDetails(res);
        const keys = cache.keys();
        const itemsByTypes = splitPayloadByContentType(items);
        await invalidateHome(res, KCDetails);
        await invalidateSubNavigation(res, keys);
        await invalidateUrlMap(res, KCDetails);
        await invalidateRootItems(items, KCDetails);
        await invalidateGeneral(itemsByTypes, KCDetails, res, 'apiSpecifications');
        await invalidateGeneral(itemsByTypes, KCDetails, res, 'footer');
        await invalidateGeneral(itemsByTypes, KCDetails, res, 'UIMessages');
        await invalidateGeneral(itemsByTypes, KCDetails, res, 'notFound');
        await invalidateGeneral(itemsByTypes, KCDetails, res, 'redirectRules');
        await invalidateGeneral(itemsByTypes, KCDetails, res, 'picker', 'platformsConfig');
        await invalidateGeneral(itemsByTypes, KCDetails, res, 'navigationItems');
        await invalidateArticles(itemsByTypes, KCDetails, res);
        await invalidateMultiple(itemsByTypes, KCDetails, 'scenarios', 'scenario');
        await invalidateMultiple(itemsByTypes, KCDetails, 'topics', 'topic');

        if (app.appInsights) {
            app.appInsights.defaultClient.trackTrace({ message: 'URL_MAP_INVALIDATE: ' + items });
        }
    }
};

module.exports = processInvalidation;
