module.exports = {
  apps: [{
    name: 'kentico-cloud-docs-web',
    script: 'server.js',
    autorestart: true,
    watch: false,
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production'
    }
  }]
};
