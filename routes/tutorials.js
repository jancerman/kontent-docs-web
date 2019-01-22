const express = require('express');
const asyncHandler = require('express-async-handler')
const router = express.Router();

const gql = require('graphql-tag');
const queries = require('../graphQL/gqlQueries');
const apolloClient = require('../apolloClient');

router.get(['/', '/:scenario', '/:scenario/:topic', '/:scenario/:topic/:article'], asyncHandler(async (req, res, next) => {
    const client = apolloClient(req);

    const navigation = await client.query({
        query: gql `${queries.navigation}`
    });

    const subNavigation = await client.query({
        query: gql `${queries.subNavigation}`
    });

    /*console.dir(subNavigation.data.itemsByType, {
        depth: null
    });*/

    res.render('pages/tutorials', {
        req: req,
        navigation: navigation.data.itemsByType[0].navigation,
        subNavigation: subNavigation.data.itemsByType,
        subNavigationLevels: [
            typeof req.params.scenario !== 'undefined' ? req.params.scenario : null,
            typeof req.params.topic !== 'undefined' ? req.params.topic : null,
            typeof req.params.article !== 'undefined' ? req.params.article : null
        ]
    });
}));

module.exports = router;