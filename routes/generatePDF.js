const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const isPreview = require('../helpers/isPreview');
const Api2Pdf = require('api2pdf');
const a2pClient = new Api2Pdf(process.env['Api2Pdf.ApiKey']);

router.get('/', asyncHandler(async (req, res, next) => {
    let url = req.query.url;

    if (!url) return res.end();

    if (url.indexOf('?') > -1) {
        url += '&';
    } else {
        url += '?';
    }

    url += 'pdf=1';

    let baseURL;

    if (process.env.ngrok) {
        baseURL = process.env.ngrok;
    } else if (process.env.baseURL) {
        baseURL = process.env.baseURL;

        if (baseURL.indexOf('localhost') > -1) {
            if (isPreview(res.locals.previewapikey)) {
                baseURL = 'https://kcd-web-preview-dev.azurewebsites.net';
            } else {
                baseURL = 'https://kcd-web-live-dev.azurewebsites.net';
            }
        }
    }

    let pdfUrl;
    let error;

    a2pClient.headlessChromeFromUrl(`${baseURL}${url}`)
        .then((result) => {
            pdfUrl = result.pdf;
        }, (rejected) => {
            error = rejected
        })
        .finally(() => {
            if (error) return next();

            return res.render('tutorials/pages/pdf', {
                req: req,
                pdfUrl: pdfUrl
            });
        })
    })
);

module.exports = router;
