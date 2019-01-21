const express = require('express');
const router = express.Router();

const gql = require('graphql-tag');
const apolloClient = require('../apolloClient');

/* GET home page. */
router.get('/', async function (_req, res, _next) {
  
  const result = await apolloClient.query({
    query: gql`
    {
      itemsByType(type: "navigation_item", limit: 50, depth: 5, order: "elements.title") {
        ... on NavigationItemContentType {
          title {
            value
          }
          url {
            value
          }
          children {
            ... on ScenarioContentType {
              title {
                value
              }
            }
          }
        }
      }
    } 
    `
  });
  res.render('pages/home', {
    req: _req,
    navigation: result.data.itemsByType
  });
});

module.exports = router;
