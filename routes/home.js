const express = require('express');
const router = express.Router();

const gql = require('graphql-tag');
const apolloClient = require('../apolloClient');

router.get('/', async function (req, res, next) {
  const client = apolloClient(req);

  const home = await client.query({
    query: gql`
    {
      itemsByType(type: "home", limit: 1, depth: 0, order: "") {
        ... on HomeContentType {
          title {
            value
          }
          description {
            value
          }
          signposts {
            linkedItemCodenames
          }
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

  res.render('pages/home', {
    req: req,
    title: typeof home.data.itemsByType[0] !== 'undefined' ? home.data.itemsByType[0].title.value : '',
    navigation: typeof home.data.itemsByType[0] !== 'undefined' ? home.data.itemsByType[0].navigation : []
  });
});

module.exports = router;
