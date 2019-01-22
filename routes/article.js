const express = require('express');
const asyncHandler = require('express-async-handler')
const router = express.Router();

const gql = require('graphql-tag');
const apolloClient = require('../apolloClient');

router.get('/', asyncHandler(async (req, res, next) => {
    const client = apolloClient(req);

    const navigation = await client.query({
        query: gql `
    {
        itemsByType(type: "home", limit: 0, depth: 0, order: "") {
            ... on HomeContentType {
                navigation {
                    ... on NavigationItemContentType {
                        title {
                            value
                        }
                        url {
                            value
                        }
                    }
                }
            }
            
        }
    } 
    `
    });

    const subNavigation = await client.query({
        query: gql `
    {
        itemsByType(type: "scenario", limit: 0, depth: 2, order: "") {
            ... on ScenarioContentType {
                title {
                    value
                }
                url {
                    value
                }
                children {
                    ... on TopicContentType {
                        title {
                            value
                        }
                        url {
                            value
                        }
                        children {
                            ... on ArticleContentType {
                                title {
                                    value
                                }
                                url {
                                    value
                                }
                            }
                        }
                    }
                }
            }
        }
    } 
    `
    });

    console.dir(subNavigation.data.itemsByType, {
        depth: null
    });

    res.render('pages/test', {
        req: req,
        navigation: navigation.data.itemsByType[0].navigation,
        subNavigation: subNavigation.data.itemsByType
    });
}));

module.exports = router;