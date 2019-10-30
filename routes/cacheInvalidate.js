const express = require('express');
const router = express.Router();
const cache = require('memory-cache');
const crypto = require('crypto');
const asyncHandler = require('express-async-handler');
const commonContent = require('../helpers/commonContent');
const requestDelivery = require('../helpers/requestDelivery');
const getRootCodenamesOfSingleItem = require('../helpers/rootItemsGetter');
const handleCache = require('../helpers/handleCache');
const app = require('../app');

const isValidSignature = (req, secret) => {
    const givenSignature = req.headers['x-kc-signature'];
    const computedSignature = crypto.createHmac('sha256', secret)
        .update(req.body)
        .digest();
    return crypto.timingSafeEqual(Buffer.from(givenSignature, 'base64'), computedSignature);
};

const requestItemAndDeleteCacheKey = async (keyNameToDelete, codename, KCDetails) => {
    const item = await requestDelivery({
        codename: codename,
        ...KCDetails
    });

    if (item.length) {
        if (!keyNameToDelete) {
            keyNameToDelete = item[0].system.type;
        }
        cache.del(`${keyNameToDelete}_${item[0].url.value}_${KCDetails.projectid}`);
    }
};

const deleteSpecificKeys = async (KCDetails, items, keyNameToCheck, keyNameToDelete) => {
    const cacheItems = cache.get(`${keyNameToCheck}_${KCDetails.projectid}`);
    if (items && cacheItems) {
        for (let i = 0; i < items.length; i++) {
            for (let j = 0; j < cacheItems.length; j++) {
                if (items[i].codename === cacheItems[j].system.codename) {
                    cache.del(`${keyNameToDelete}_${cacheItems[j].url.value}_${KCDetails.projectid}`);
                }
            }
        }
    } else if (items) {
        items.forEach(async (item) => {
            await requestItemAndDeleteCacheKey(keyNameToDelete, item.codename, KCDetails);
        });
    }
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
        navigationItems: []
    };

    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type === 'footer') {
            itemsByTypes.footer.push(item);
        } else if (item.type === 'ui_messages') {
            itemsByTypes.UIMessages.push(item);
        } else if (item.type === 'article' || item.type === 'multiplatform_article') {
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
    items.forEach((item) => {
        const roots = getRootCodenamesOfSingleItem(item, allItems);
        roots.forEach(codename => rootCodenames.add(codename));
    });

    return rootCodenames;
};

const invalidateRootItems = async (items, KCDetails) => {
    const rootItems = Array.from(await getRootItems(items, KCDetails));

    for await (const rootItem of rootItems) {
        await requestItemAndDeleteCacheKey(null, rootItem, KCDetails);
    }
};

const invalidateGeneral = (itemsByTypes, KCDetails, type, keyName) => {
    if (!keyName) {
        keyName = type;
    }

    if (itemsByTypes[type].length) {
        cache.del(`${keyName}_${KCDetails.projectid}`);
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

const invalidateArticles = async (itemsByTypes, KCDetails) => {
    if (itemsByTypes.articles.length) {
        await deleteSpecificKeys(KCDetails, itemsByTypes.articles, 'articles', 'article');
        await deleteSpecificKeys(KCDetails, itemsByTypes.articles, 'articles', 'reference');
        cache.del(`articles_${KCDetails.projectid}`);
        cache.del(`rss_articles_${KCDetails.projectid}`);
    }

    return false;
};

router.post('/', asyncHandler(async (req, res) => {
    if (process.env['Webhook.Cache.Invalidate.CommonContent']) {
        if (isValidSignature(req, process.env['Webhook.Cache.Invalidate.CommonContent'])) {
            const KCDetails = commonContent.getKCDetails(res);
            const items = JSON.parse(req.body).data.items;
            const keys = cache.keys();
            const itemsByTypes = splitPayloadByContentType(items);

            await invalidateRootItems(items, KCDetails);
            invalidateGeneral(itemsByTypes, KCDetails, 'footer');
            invalidateGeneral(itemsByTypes, KCDetails, 'UIMessages');
            invalidateGeneral(itemsByTypes, KCDetails, 'notFound');
            invalidateGeneral(itemsByTypes, KCDetails, 'picker', 'platformsConfig');
            invalidateGeneral(itemsByTypes, KCDetails, 'navigationItems');
            await invalidateArticles(itemsByTypes, KCDetails);
            await invalidateMultiple(itemsByTypes, KCDetails, 'scenarios', 'scenario');
            await invalidateMultiple(itemsByTypes, KCDetails, 'topics', 'topic');

            cache.del(`home_${KCDetails.projectid}`);

            handleCache.deleteMultipleKeys('subNavigation_', keys);

            cache.del(`urlMap_${KCDetails.projectid}`);
            if (app.appInsights) {
                app.appInsights.defaultClient.trackTrace({ message: 'URL_MAP_INVALIDATE: ' + req.body });
            }
        }
    }

    return res.end();
}));

module.exports = router;
