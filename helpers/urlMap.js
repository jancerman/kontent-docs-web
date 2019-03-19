const { DeliveryClient } = require('kentico-cloud-delivery');
const { deliveryConfig } = require('../config');

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

const typeLevels = {
    home: {
        urlLength: 0
    },
    navigation_item: {
        urlLength: 1
    },
    scenario: {
        urlLength: 2
    },
    topic: {
        urlLength: 3
    },
    article: {
        urlLength: 4
    },
    multiplatform_article: {
        urlLength: 4
    }
};

const createUrlMap = (response, fields, url, urlMap = []) => {
    let node = '';

    if (response.items) node = 'items';
    if (response.navigation) node = 'navigation';
    if (response.children) node = 'children';

    if (response[node]) {
        if (response.system && response.system.type === 'multiplatform_article') {
            typeLevels.article.urlLength = 5;
        } else {
            typeLevels.article.urlLength = 4;
        }

        response[node].forEach(item => {
            if (item.elements.url && typeLevels[item.system.type]) {
                url.length = typeLevels[item.system.type].urlLength;
                let slug = '';
                if (response.system && response.system.type === 'multiplatform_article') {
                    slug = item.elements.platform.value[0].codename === '_net' ? 'dotnet' : item.elements.platform.value[0].codename;
                } else {
                    slug = item.elements.url.value;
                }
                url[url.length - 1] = slug;
            }

            if (typeLevels[item.system.type]) {
                urlMap.push(getMapItem({
                    codename: item.system.codename,
                    url: `/${url.join('/')}`,
                    date: item.system.last_modified
                }, fields));
            }

            createUrlMap(item, fields, url, urlMap);
        });
    }

    return urlMap;
};

const getUrlMap = async (config) => {
    deliveryConfig.projectId = config.projectid;

    if (config.previewapikey) {
        deliveryConfig.previewApiKey = config.previewapikey;
        deliveryConfig.enablePreviewMode = true;
    }

    if (config.securedapikey) {
        deliveryConfig.securedApiKey = config.securedapikey;
        deliveryConfig.enableSecuredMode = true;
    }

    const deliveryClient = new DeliveryClient(deliveryConfig);

    const query = deliveryClient.items()
        .type('home')
        .depthParameter(5);

    const response = await query
        .getPromise();

    let fields = ['codename', 'url'];

    if (config.isSitemap) {
        fields = ['url', 'date'];
    }

    return createUrlMap(response, fields, []);
};

module.exports = getUrlMap;
