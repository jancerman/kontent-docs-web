const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const isPreview = require('../helpers/isPreview');
const helper = require('../helpers/helperFunctions');
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
    const fileName = url.split('?')[0].split('/').slice(-1)[0];
    const options = {
        marginBottom: 0.6,
        marginLeft: 0.8,
        marginRight: 0.8,
        marginTop: 0.8,
        displayHeaderFooter: true,
        headerTemplate: `<div style="font-family:Arial;width:100%;font-size:9px;padding:0 0.6in;color:silver;">${isPreview(res.locals.previewapikey) ? 'Preview | ' : ''}<span class="title"></span> | ${helper.getDomain(req.protocol, req.get('Host'))}${req.query.url}</div>`,
        footerTemplate: '<div style="font-family:Arial;width:100%;font-size:9px;padding:0 0.6in;color:silver;"><div style="display:inline-block;width:49%;">kontent.ai</div><div style="display:inline-block;width:49%;text-align:right;"><span class="pageNumber"></span> of <span class="totalPages"></span></div></div>'
    };

    a2pClient.headlessChromeFromUrl(`${baseURL}${url}`, true, `${fileName}.pdf`, options)
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
