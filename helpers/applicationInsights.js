const app = require('../app');

const trackTrace = (message) => {
  if (app.appInsights) {
    app.appInsights.defaultClient.trackTrace({ message: message });
  }
};

module.exports = {
  trackTrace,
};
