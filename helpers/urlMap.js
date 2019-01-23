const {
    DeliveryClient
} = require('kentico-cloud-delivery');
const {
    deliveryConfig
} = require('../config');

deliveryConfig.projectId = process.env['KC.ProjectId'];

if (process.env['KC.PreviewApiKey']) {
    deliveryConfig.previewApiKey = process.env['KC.PreviewApiKey'];
    deliveryConfig.enablePreviewMode = true;
}

const deliveryClient = new DeliveryClient(deliveryConfig);

const getUrlMap = async () => {
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
}



module.exports = getUrlMap;