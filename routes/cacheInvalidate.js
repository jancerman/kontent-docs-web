const express = require('express');
const router = express.Router();
const cache = require('memory-cache');
const crypto = require('crypto');
const commonContent = require('../helpers/commonContent');

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

const deleteSpecificKeys = (KCDetails, items, keyNameToCheck, keyNameToDelete) => {
    let cacheItems = cache.get(`${keyNameToCheck}_${KCDetails.projectid}`);
    if (items && cacheItems) {
        for (let i = 0; i < items.length; i++) {
            for (let j = 0; j < cacheItems.length; j++) {
                if (items[i].codename === cacheItems[j].system.codename) {
                    cache.del(`${keyNameToDelete}_${cacheItems[j].elements.url.value}_${KCDetails.projectid}`);
                }
            }; 
        };
    } else {
        deleteMultipleKeys(cache.keys(), `${keyNameToDelete}_`);
    }
};

const splitPayloadByContentType = (items) => {
    let itemsByTypes = {
        footer: [],
        UIMessages: [],
        articles:[],
        scenarios: [],
        topics: [],
        notFound: [],
        certification: []
    };

    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type === 'footer') {
            itemsByTypes.footer.push(item);
        } else if (item.type === 'ui_messages') {
            itemsByTypes.UIMessages.push(item);
        } else if (item.type === 'article') {
            itemsByTypes.articles.push(item);
        } else if (item.type === 'scenario') {
            itemsByTypes.scenarios.push(item);
        } else if (item.type === 'topic') {
            itemsByTypes.topics.push(item);
        } else if (item.type === 'not_found') {
            itemsByTypes.notFound.push(item);
        } else if (item.type === 'certification') {
            itemsByTypes.certification.push(item);
        }
    }

    return itemsByTypes;
};

router.post('/platforms-config', (req, res) => {
    if (process.env['Webhook.Cache.Invalidate.PlatformsConfig']) {
        if (isValidSignature(req, process.env['Webhook.Cache.Invalidate.PlatformsConfig'])) {
            let picker = JSON.parse(req.body).data.items.filter(item => item.codename === 'platform_picker');
            if (picker.length) {
                const KCDetails = commonContent.getKCDetails(res);
                cache.del(`platformsConfig_${KCDetails.projectid}`);
            }
        }
    }

    return res.end();
});

router.post('/url-map', (req, res) => {
    const KCDetails = commonContent.getKCDetails(res);
    cache.del(`urlMap_${KCDetails.projectid}`);

    return res.end();
});

router.post('/common-content', (req, res) => {
    if (process.env['Webhook.Cache.Invalidate.CommonContent']) {
        if (isValidSignature(req, process.env['Webhook.Cache.Invalidate.CommonContent'])) {
            const KCDetails = commonContent.getKCDetails(res);
            const items = JSON.parse(req.body).data.items;
            const keys = cache.keys();
            let itemsByTypes = splitPayloadByContentType(items);

            if (itemsByTypes.footer.length) {
                cache.del(`footer_${KCDetails.projectid}`);
            }

            if (itemsByTypes.UIMessages.length) {
                cache.del(`UIMessages_${KCDetails.projectid}`);
            }

            if (itemsByTypes.articles.length) {
                deleteSpecificKeys(KCDetails, itemsByTypes.articles, 'articles', 'article');
                cache.del(`articles_${KCDetails.projectid}`);
                cache.del(`rss_articles_${KCDetails.projectid}`);
            }

            if (itemsByTypes.scenarios.length) {
                deleteMultipleKeys(keys, 'scenario_');
            }

            if (itemsByTypes.topics.length) {
                deleteMultipleKeys(keys, 'topic_');
            }

            if (itemsByTypes.notFound.length) {
                cache.del(`notFound_${KCDetails.projectid}`);
            }

            if (itemsByTypes.certification.length) {
                cache.del(`certification_${KCDetails.projectid}`);
            }

            cache.del(`home_${KCDetails.projectid}`);

            deleteMultipleKeys(keys, 'subNavigation_');
        }
    }

    return res.end();
});

module.exports = router;
