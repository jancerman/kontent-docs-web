const express = require('express');
const asyncHandler = require('express-async-handler')
const router = express.Router();

const gql = require('graphql-tag');
const queries = require('../graphQL/gqlQueries');
const apolloClient = require('../apolloClient');

const moment = require('moment');

router.get(['/', '/:scenario', '/:scenario/:topic', '/:scenario/:topic/:article'], asyncHandler(async (req, res, next) => {
    const client = apolloClient(req);

    const navigation = await client.query({
        query: gql `${queries.navigation}`
    });

    const subNavigation = await client.query({
        query: gql `${queries.subNavigation}`
    });

    const subNavigationLevels = [
        typeof req.params.scenario !== 'undefined' ? req.params.scenario : null,
        typeof req.params.topic !== 'undefined' ? req.params.topic : null,
        typeof req.params.article !== 'undefined' ? req.params.article : null
    ];

    const currentLevel = subNavigationLevels.filter( item => item !== null ).length - 1;

    let content, view;

    if (currentLevel === -1) {
        content = await client.query({
            query: gql `${queries.navigationItem(req.originalUrl.split('/')[1])}`
        });

        if (typeof content.data.itemsByType[0] === 'undefined') {
            return next();
        }

        if (typeof content.data.itemsByType[0] !== 'undefined') {
            return res.redirect(`/tutorials/${content.data.itemsByType[0].children[0].url.value}`);
        }
    } else if (currentLevel === 0) {
        content = await client.query({
            query: gql `${queries.scenario(subNavigationLevels[currentLevel])}`
        });

        if (typeof content.data.itemsByType[0] === 'undefined') {
            return next();
        }

        view = 'pages/scenario';
    } else if (currentLevel === 1) {
        content = await client.query({
            query: gql `${queries.topic(subNavigationLevels[currentLevel])}`
        });

        if (typeof content.data.itemsByType[0] === 'undefined') {
            return next();
        }

        return res.redirect(`/tutorials/${subNavigationLevels[currentLevel - 1]}/${subNavigationLevels[currentLevel]}/${content.data.itemsByType[0].children[0].url.value}`);
    } else if (currentLevel === 2) {
        content = await client.query({
            query: gql `${queries.article(subNavigationLevels[currentLevel])}`
        });

        if (typeof content.data.itemsByType[0] === 'undefined') {
            return next();
        }

        view = 'pages/article';
    } else {
        return next();
    }

    /*console.dir(content.data.itemsByType, {
        depth: null
    })

    console.dir(subNavigation.data.itemsByType, {
        depth: null
    });*/

    //console.log(content.data.itemsByType[0].content);

    return res.render(view, {
        req: req,
        moment: moment,
        title: content.data.itemsByType[0].title.value,
        description: content.data.itemsByType[0].description.value,
        navigation: navigation.data.itemsByType[0].navigation,
        subNavigation: subNavigation.data.itemsByType[0].children,
        subNavigationLevels: subNavigationLevels,
        content: content.data.itemsByType[0]
    });
}));

module.exports = router;