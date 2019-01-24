const { DeliveryClient } = require('kentico-cloud-delivery');
const { deliveryConfig } = require('../config');

const getUrlMap = async (config) => {
    deliveryConfig.projectId = (typeof config.projectid !== 'undefined' && config.projectid !== null) ? config.projectid : process.env['KC.ProjectId'];
    const previewApiKey = (typeof config.previewapikey !== 'undefined' && config.previewapikey !== null) ? config.previewapikey : process.env['KC.PreviewApiKey'];

    if (previewApiKey) {
        deliveryConfig.previewApiKey = previewApiKey;
        deliveryConfig.enablePreviewMode = true;
    }

    const deliveryClient = new DeliveryClient(deliveryConfig);

    const query = deliveryClient.items()
        .type('home')
        .depthParameter(5);

    const response = await query
        .getPromise();

    let urlMap = [];

    response.items.forEach(home => {
        urlMap.push({
            codename: home.system.codename,
            title: home.elements.title.value,
            url: `/`
        });

        home.navigation.forEach(navigationItem => {
            urlMap.push({
                codename: navigationItem.system.codename,
                title: navigationItem.elements.title.value,
                url: `/${navigationItem.elements.url.value}`
            });

            navigationItem.children.forEach(scenario => {
                urlMap.push({
                    codename: scenario.system.codename,
                    title: scenario.elements.title.value,
                    url: `/${navigationItem.elements.url.value}/${scenario.elements.url.value}`
                });

                scenario.children.forEach(topic => {
                    urlMap.push({
                        codename: topic.system.codename,
                        title: topic.elements.title.value,
                        url: `/${navigationItem.elements.url.value}/${scenario.elements.url.value}/${topic.elements.url.value}`
                    });

                    topic.children.forEach(article => {
                        urlMap.push({
                            codename: article.system.codename,
                            title: article.elements.title.value,
                            url: `/${navigationItem.elements.url.value}/${scenario.elements.url.value}/${topic.elements.url.value}/${article.elements.url.value}`
                        });
                    });
                });
            });
        });
    });

    return urlMap;
};

module.exports = getUrlMap;