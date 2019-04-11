const { DeliveryClient } = require('kentico-cloud-delivery');
const { deliveryConfig } = require('../config');
const cache = require('memory-cache');
let globalConfig;

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

// Define length of url for specific content types (number of path elements)
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
    let queryString = '';

    if (response.items) node = 'items';
    if (response.navigation) node = 'navigation';
    if (response.children) node = 'children';

    if (response[node]) {
        response[node].forEach(item => {
            // Redefine urls length if "multiplatform_article" is parent of an article
            if (response.system && response.system.type === 'multiplatform_article') {
                typeLevels.article.urlLength = 5;
            } else {
                typeLevels.article.urlLength = 4;
            }

            if (item.elements.url && typeLevels[item.system.type]) {
                url.length = typeLevels[item.system.type].urlLength;
                let slug = '';

                if (response.system && response.system.type === 'multiplatform_article') {
                    // Handle "lang" query string in case articles are assigned to "multiplatform_article"
                    queryString = '?lang=';
                    const cachedPlatforms = cache.get('platformsConfig');
                    if (cachedPlatforms) {
                        queryString += cachedPlatforms[0].options.filter(elem => item.elements.platform.value[0].codename === elem.platform.value[0].codename)[0].url.value;
                    } else {
                        queryString += item.elements.platform.value[0].codename === '_net' ? 'dotnet' : item.elements.platform.value[0].codename;
                    }
                } else if (item.system && item.system.type === 'article' && globalConfig.isSitemap) {
                    // Handle "lang" query string in case "article" has values selected in the "Platform" field
                    if (item.elements.platform.value) {
                        slug = item.elements.url.value;
                        url[url.length - 1] = slug;
                        const cachedPlatforms = cache.get('platformsConfig');

                        // Add url to map for each platform in an article
                        item.elements.platform.value.forEach(elem => {
                            queryString = '?lang=';
                            if (cachedPlatforms) {
                                queryString += cachedPlatforms[0].options.filter(plat => elem.codename === plat.system.codename)[0].url.value;
                            } else {
                                queryString += elem.codename === '_net' ? 'dotnet' : elem.codename;
                            }

                            urlMap.push(getMapItem({
                                codename: item.system.codename,
                                url: `/${url.join('/')}${queryString}`,
                                date: item.system.last_modified
                            }, fields));
                        });

                        queryString = '';
                    }
                } else {
                    slug = item.elements.url.value;
                }

                if (slug) {
                    url[url.length - 1] = slug;
                } else {
                    url.length = url.length - 1;
                }
            }

            // Add url to map
            if (typeLevels[item.system.type]) {
                urlMap.push(getMapItem({
                    codename: item.system.codename,
                    url: `/${url.join('/')}${queryString}`,
                    date: item.system.last_modified
                }, fields));
            }

            queryString = '';

            createUrlMap(item, fields, url, urlMap);
        });
    }

    return urlMap;
};

const getUrlMap = async (config) => {
    globalConfig = config;
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
