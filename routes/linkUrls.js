const express = require('express');
const router = express.Router();
const getUrlMap = require('../helpers/urlMap');
const asyncHandler = require('express-async-handler');
const handleCache = require('../helpers/handleCache');

router.get('/:codenames', asyncHandler(async (req, res, next) => {
    const codenames = req.params.codenames.split('/');

    if (codenames.length === 0) {
        return next();
    } else {
        await handleCache.evaluateCommon(res, ['urlMap']);

        const urlMap = await handleCache.ensureSingle(res, 'urlMap', async () => {
            return await getUrlMap(res);
        });

        const urlsWithCodename = urlMap && urlMap.filter(elem => elem.codename === codenames[0]);
        const resolvedUrl = urlsWithCodename && urlsWithCodename.length && urlsWithCodename[0].url;

        if (resolvedUrl) {
            return res.redirect(303, resolvedUrl);
        } else {
            return next();
        }
    }
}));

module.exports = router;
