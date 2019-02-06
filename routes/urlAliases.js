const express = require('express');
const asyncHandler = require('express-async-handler');

const requestDelivery = require('../helpers/requestDelivery');
const getUrlMap = require('../helpers/urlMap');

const getArticles = async (res) => {
    return await requestDelivery({
        type: 'article',
        projectid: res.locals.projectid,
        previewapikey: res.locals.previewapikey
    });
};

const urlAliases = asyncHandler(async (req, res, next) => {
    const urlSplit = req.originalUrl.split('?');
    const queryParamater = urlSplit[1] ? urlSplit[1] : '';
    const originalUrl = urlSplit[0].trim().toLowerCase().replace(/\/\s*$/, '');

    const urlMapSettings = {
        projectid: res.locals.projectid,
        previewapikey: res.locals.previewapikey,
    };
    
    const articles = await getArticles(res);
    const urlMap = await getUrlMap(urlMapSettings);
    let redirectUrl = '';

    articles.forEach(item => {
        aliases = item.vanity_urls.value.trim().split(';');
        aliases.forEach(alias => {
            alias = alias.trim().toLowerCase().replace(/\/\s*$/, '');
            if (alias === originalUrl) {
                urlMap.forEach(url => {
                    if (url.codename === item.system.codename) {
                        redirectUrl = url.url;
                    }
                });
            }
        });   
    });

    if (redirectUrl) {
        return res.redirect(`${redirectUrl}${queryParamater ? '?' + queryParamater : ''}`);
    } else {
        const err = new Error('Not Found');
        err.status = 404;
        return next(err);
    } 
});

module.exports = urlAliases;