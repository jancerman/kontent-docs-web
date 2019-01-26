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

    const getMapItem = (data, fields) => {
        let item = {};

        fields.forEach(field => {
            switch (field) {
                case 'codename':
                    item.codename = data.codename;
                    break;
                case 'url':
                    item.url = data.url;
                    break;
                case 'date': 
                    item.date = data.date;
                    break;
            }; 
        });

        return item;
    };

    let fields = ['codename', 'url'];

    if (config.isSitemap) {
        fields = ['url', 'date'];
    }

    response.items.forEach(home => {
        urlMap.push(getMapItem({
            codename: home.system.codename,
            url: `/`,
            date: home.system.last_modified
        }, fields));

        home.navigation.forEach(navigationItem => {
            urlMap.push(getMapItem({
                codename: navigationItem.system.codename,
                url: `/${navigationItem.elements.url.value}`,
                date: navigationItem.system.last_modified
            }, fields));

            navigationItem.children.forEach(scenario => {
                urlMap.push(getMapItem({
                    codename: scenario.system.codename,
                    url: `/${navigationItem.elements.url.value}/${scenario.elements.url.value}`,
                    date: scenario.system.last_modified
                }, fields));

                scenario.children.forEach(topic => {
                    urlMap.push(getMapItem({
                        codename: topic.system.codename,
                        url: `/${navigationItem.elements.url.value}/${scenario.elements.url.value}/${topic.elements.url.value}`,
                        date: topic.system.last_modified
                    }, fields));

                    topic.children.forEach(article => {
                        urlMap.push(getMapItem({
                            codename: article.system.codename,
                            url: `/${navigationItem.elements.url.value}/${scenario.elements.url.value}/${topic.elements.url.value}/${article.elements.url.value}`,
                            date: article.system.last_modified
                        }, fields));
                    });
                });
            });
        });
    });

    return urlMap;
};

module.exports = getUrlMap;