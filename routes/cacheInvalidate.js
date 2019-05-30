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

    res.end();
});

router.post('/url-map', (req, res) => {
    const KCDetails = commonContent.getKCDetails(res);
    cache.del(`urlMap_${KCDetails.projectid}`);

    res.end();
});

router.post('/common-content', (req, res) => {
    if (process.env['Webhook.Cache.Invalidate.CommonContent']) {
        if (isValidSignature(req, process.env['Webhook.Cache.Invalidate.CommonContent'])) {
            const KCDetails = commonContent.getKCDetails(res);
            let footer = JSON.parse(req.body).data.items.filter(item => item.type === 'footer');
            let UIMessages = JSON.parse(req.body).data.items.filter(item => item.type === 'ui_messages');

            if (footer.length) {
                cache.del(`footer_${KCDetails.projectid}`);
            }

            if (UIMessages.length) {
                cache.del(`UIMessages_${KCDetails.projectid}`);
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

    res.end();
});

module.exports = router;
