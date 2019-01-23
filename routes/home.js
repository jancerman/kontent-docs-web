const express = require('express');
const router = express.Router();

const queries = require('../graphQL/gqlQueries');
const gql = require('graphql-tag');

router.get('/', async function (req, res, next) {
  const home = await req.app.locals.apolloClient.query({
    query: gql `${queries.home}`
  });

  if (!home.data.itemsByType[0]) {
    return next();
  }

  return res.render('pages/home', {
    req: req,
    title: home.data.itemsByType[0].title.value,
    navigation: home.data.itemsByType[0].navigation,
    signposts: home.data.itemsByType[0].signposts.value
  });
});

module.exports = router;
