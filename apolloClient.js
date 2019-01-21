const { ApolloClient } = require('apollo-client');
const { InMemoryCache } = require('apollo-cache-inmemory');
const { createHttpLink } = require('apollo-link-http');
const fetch = require('node-fetch');

const { graphQLPath } = require('./config');

const createClient = (req) => {
  const uri = `${req.protocol}://${req.get('host')}${graphQLPath}`;
  const link = createHttpLink({ uri, fetch });
  const cache = new InMemoryCache();
  
  return new ApolloClient({
    link,
    cache
  });
};

module.exports = createClient;