const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const getUrlMap = require('../helpers/urlMap');
const handleCache = require('../helpers/handleCache');
const Api2Pdf = require('api2pdf');
const a2pClient = new Api2Pdf(process.env['Api2Pdf.ApiKey']);

router.get('/:codename', asyncHandler(async (req, res, next) => {
    const urlMap = await handleCache.ensureSingle(res, 'urlMap', async () => {
        return await getUrlMap(res);
    });

    let url = '';

    for (let i = 0; i < urlMap.length; i++) {
        if (urlMap[i].codename === req.params.codename) {
            url = urlMap[i].url;
        }
    }

    if (!url) return res.end();

    a2pClient.headlessChromeFromUrl(`https://docs.kontent.ai${url}`)
        .then((result) => {
            console.log(result);
        }, (rejected) => {
            console.log(rejected);
        })
        .finally(() => {
            return res.end();
        })
    })
);

module.exports = router;
