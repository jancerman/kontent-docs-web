const express = require('express');
const router = express.Router();
const axios = require('axios');
const asyncHandler = require('express-async-handler');
const handleCache = require('../helpers/handleCache');

router.get('/', asyncHandler(async (req, res) => {
    res.cacheControl = {
        public: true,
        maxAge: 31536000
    };

    const icons = await handleCache.ensureSingle(res, 'kenticoIcons_', async () => {
        return await axios.get('https://cdn.jsdelivr.net/gh/Kentico/kentico-icons/production/icon-variables.less');
    });

    const lines = icons.data.split('\n');
    let css = '';

    for (let i = 0; i < lines.length; i++) {
        const rule = lines[i].split(':')
        if (rule.length === 2) {
            css += `${rule[0] ? rule[0].replace('@', '.') : ''}:before{content:${rule[1] ? rule[1].trim().replace(';', '') : ''}}`;
        }
    }

    res.header('Content-Type', 'text/css');
    return res.send(css);
}));

module.exports = router;
