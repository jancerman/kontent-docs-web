const express = require('express');
const router = express.Router();
const cache = require('memory-cache');
const crypto = require('crypto');
const asyncHandler = require('express-async-handler');
const commonContent = require('../helpers/commonContent');
const requestDelivery = require('../helpers/requestDelivery');
const app = require('../app');

const isValidSignature = (req, secret) => {
    const givenSignature = req.headers['x-kc-signature'];
    const computedSignature = crypto.createHmac('sha256', secret)
        .update(req.body)
        .digest();
    return crypto.timingSafeEqual(Buffer.from(givenSignature, 'base64'), computedSignature);
};

const deleteMultipleKeys = (keys, startsWithString) => {
    for (let i = 0; i < keys.length; i++) {
        if (keys[i].startsWith(startsWithString)) {
            cache.del(keys[i]);
        }
    }
};

const requestItemAndDeleteCacheKey = async (keyNameToDelete, codename, KCDetails) => {
    let item = await requestDelivery({
        codename: codename,
        ...KCDetails
    });

    if (item.length) {
        cache.del(`${keyNameToDelete}_${item[0].elements.url.value}_${KCDetails.projectid}`);
    }
};

const deleteSpecificKeys = async (KCDetails, items, keyNameToCheck, keyNameToDelete) => {
    let cacheItems = cache.get(`${keyNameToCheck}_${KCDetails.projectid}`);
    if (items && cacheItems) {
        for (let i = 0; i < items.length; i++) {
            for (let j = 0; j < cacheItems.length; j++) {
                if (items[i].codename === cacheItems[j].system.codename) {
                    cache.del(`${keyNameToDelete}_${cacheItems[j].elements.url.value}_${KCDetails.projectid}`);
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
    let itemsByTypes = {
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
        }
    }

    return itemsByTypes;
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
            let itemsByTypes = splitPayloadByContentType(items);

            invalidateGeneral(itemsByTypes, KCDetails, 'footer');
            invalidateGeneral(itemsByTypes, KCDetails, 'UIMessages');
            invalidateGeneral(itemsByTypes, KCDetails, 'notFound');
            invalidateGeneral(itemsByTypes, KCDetails, 'picker', 'platformsConfig');
            invalidateGeneral(itemsByTypes, KCDetails, 'navigationItems');
            await invalidateArticles(itemsByTypes, KCDetails);
            await invalidateMultiple(itemsByTypes, KCDetails, 'scenarios', 'scenario');
            await invalidateMultiple(itemsByTypes, KCDetails, 'topics', 'topic');

            cache.del(`home_${KCDetails.projectid}`);

            deleteMultipleKeys(keys, 'subNavigation_');

            cache.del(`urlMap_${KCDetails.projectid}`);
            if (app.appInsights) {
                app.appInsights.defaultClient.trackTrace({ message: 'URL_MAP_INVALIDATE: ' + req.body });
            }
        }
    }

    return res.end();
}));

module.exports = router;
