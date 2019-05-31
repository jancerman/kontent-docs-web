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
            let footer = [];
            let UIMessages = [];
            let articles = [];
            let notFound = [];
            let certification = [];

            for (let i = 0; i < items.length; i++) {
                const item = items[i];
                if (item.type === 'footer') {
                    footer.push(item);
                } else if (item.type === 'ui_messages') {
                    UIMessages.push(item);
                } else if (item.type === 'article') {
                    articles.push(item);
                } else if (item.type === 'not_found') {
                    notFound.push(item);
                } else if (item.type === 'certification') {
                    certification.push(item);
                }
            }

            if (footer.length) {
                cache.del(`footer_${KCDetails.projectid}`);
            }

            if (UIMessages.length) {
                cache.del(`UIMessages_${KCDetails.projectid}`);
            }

            if (articles.length) {
                cache.del(`articles_${KCDetails.projectid}`);
                cache.del(`rss_articles_${KCDetails.projectid}`);
            }

            if (notFound.length) {
                cache.del(`notFound_${KCDetails.projectid}`);
            }

            if (certification.length) {
                cache.del(`certification_${KCDetails.projectid}`);
            }

            cache.del(`home_${KCDetails.projectid}`);

            // Delete all subnavigation keys
            const keys = cache.keys();
            for (let i = 0; i < keys.length; i++) {
                if (keys[i].startsWith('subNavigation_')) {
                    cache.del(keys[i]);
                }
            }
        }
    }

    return res.end();
});

module.exports = router;
