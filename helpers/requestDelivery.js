const { DeliveryClient } = require('@kentico/kontent-delivery');
const {
    deliveryConfig
} = require('../config');
const enhanceMarkup = require('./enhanceMarkup');
const helpers = require('./helperFunctions');
const app = require('../app');

const richTextResolverTemplates = require('./richTextResolverTemplates');
const linksResolverTemplates = require('./linksResolverTemplates');
const compomentsInRichText = [];

const defineDeliveryConfig = (config) => {
    deliveryConfig.projectId = config.projectid;
    deliveryConfig.globalQueryConfig = {};

    const previewApiKey = config.previewapikey;
    const securedApiKey = config.securedapikey;

    if (previewApiKey) {
        deliveryConfig.previewApiKey = previewApiKey;
        deliveryConfig.globalQueryConfig.usePreviewMode = true;
    }

    if (securedApiKey) {
        deliveryConfig.secureApiKey = securedApiKey;
        deliveryConfig.globalQueryConfig.useSecuredMode = true;
    }
};

const addQueryToOrder = (query, config) => {
    if (config.order.field && config.order.type) {
        if (config.order.type === 'descending') {
            query.orderByDescending(config.order.field);
        }

        if (config.order.type === 'ascending') {
            query.orderByAscending(config.order.field);
        }
    }

    return query;
};

const defineQuery = (deliveryConfig, config) => {
    const deliveryClient = new DeliveryClient(deliveryConfig);

    if (config.data === 'type' && config.type) {
        return deliveryClient.type(config.type);
    }

    let query = deliveryClient.items()

    if (config.type) {
        query.type(config.type);
    }
    if (config.types) {
        query.types(config.types);
    }
    if (config.codename) {
        query.equalsFilter('system.codename', config.codename);
    }
    if (config.depth) {
        query.depthParameter(config.depth);
    }
    if (config.slug) {
        query.equalsFilter('elements.url', config.slug);
    }
    if (config.limit) {
        query.limitParameter(config.limit)
    }
    if (config.order) {
        query = addQueryToOrder(query, config);
    }

    return query;
};

const componentsResolvers = [{
    type: 'embedded_content',
    resolver: richTextResolverTemplates.embeddedContent
}, {
    type: 'signpost',
    resolver: richTextResolverTemplates.signpost
}, {
    type: 'signpost_item',
    resolver: richTextResolverTemplates.signpostItem
}, {
    type: 'callout',
    resolver: richTextResolverTemplates.callout
}, {
    type: 'home__link_to_content_item',
    resolver: richTextResolverTemplates.homeLinkToContentItem
}, {
    type: 'image',
    resolver: richTextResolverTemplates.image
}, {
    type: 'call_to_action',
    resolver: richTextResolverTemplates.callToAction
}, {
    type: 'home__link_to_external_url',
    resolver: richTextResolverTemplates.homeLinkToExternalUrl
}, {
    type: 'code_sample',
    resolver: richTextResolverTemplates.codeSample
}, {
    type: 'code_samples',
    resolver: richTextResolverTemplates.codeSamples
}, {
    type: 'content_chunk',
    resolver: richTextResolverTemplates.contentChunk
}, {
    type: 'content_switcher',
    resolver: richTextResolverTemplates.contentSwitcher
}, {
    type: 'release_note',
    resolver: richTextResolverTemplates.releaseNote
}, {
    type: 'changelog',
    resolver: richTextResolverTemplates.changelog
}, {
    type: 'terminology',
    resolver: richTextResolverTemplates.terminology
}, {
    type: 'training_course',
    resolver: richTextResolverTemplates.trainingCourse
}];

const resolveRichText = (item, config) => {
    item = linksResolverTemplates.resolveInnerRichTextLinks(item, config.urlMap);

    for (var i = 0; i < config.componentsResolvers.length; i++) {
        if (item.system.type === config.componentsResolvers[i].type) {
            compomentsInRichText.push({
                codename: item.system.codename,
                type: config.componentsResolvers[i].type
            });

            if (config.richTextResolvers) {
                for (let j = 0; j < config.richTextResolvers.length; j++) {
                    if (config.richTextResolvers[j].type === config.componentsResolvers[i].type) {
                        config.customField = config.richTextResolvers[j].custom;
                        return config.richTextResolvers[j].resolver(item, config);
                    }
                }
            }

            return config.componentsResolvers[i].resolver(item, config);
        }
    }

    return `Missing Rich text resolver for the ${item.system.type} type.`;
};

const resolveLink = (link, config) => {
    if (config.urlMap && config.urlMap.length) {
        return linksResolverTemplates.resolve(link, config.urlMap);
    } else {
        return '/';
    }
};

const extendLinkedItems = (response) => {
    if (response && response.items) {
        for (const item of response.items) {
            for (const prop in item) {
                if (Object.prototype.hasOwnProperty.call(item, prop)) {
                    if (item[prop] && item[prop].type === 'rich_text') {
                        item[prop].linkedItems_custom = [];
                        for (const component of compomentsInRichText) {
                            for (const linkedItem of item[prop].linkedItemCodenames) {
                                if (component.codename === linkedItem) {
                                    item[prop].linkedItems_custom.push(component);
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    return response;
};

const getResponse = async (query, config) => {
    let error;
    let response = await query
        .toPromise()
        .catch(err => {
            error = err;
        });

    // Retry in case of stale content or error
    const temps = [0];
    for await (let temp of temps) {
        if ((!error && ((response && response.hasStaleContent) || !response)) || error) {
            error = null;
            await helpers.sleep(5000);
            response = await query
                .toPromise()
                .catch(err => {
                    error = err;
                });

            if (temp < 5) {
                temps.push(++temp);
            }
        }
    }

    if (config.resolveRichText && response && response.items) {
        response.items.forEach((elem) => {
            const keys = helpers.removeUnderscoreElems(Object.keys(elem));

            if (keys.length) {
                keys
                    .filter((key) => Object.prototype.hasOwnProperty.call(elem, key) && Object.prototype.hasOwnProperty.call(elem[key], 'type') && elem[key].type === 'rich_text')
                    .forEach((key) => {
                        if (elem[key]) {
                            elem[key].resolveHtml();
                            elem[key].value = enhanceMarkup(elem[key].resolvedData.html);
                        }
                    });
            }
        });
    }

    if (error && app.appInsights) {
        app.appInsights.defaultClient.trackTrace({ message: 'DELIVERY_API_ERROR: ' + error.message });
    }

    return response;
};

const requestDelivery = async (config) => {
    defineDeliveryConfig(config);
    config.componentsResolvers = componentsResolvers;
    const query = defineQuery(deliveryConfig, config);
    const queryConfigObject = {};

    if (config.resolveRichText) {
        queryConfigObject.richTextResolver = (item) => {
            return resolveRichText(item, config);
        };
        queryConfigObject.urlSlugResolver = (link) => {
            const links = resolveLink(link, config);
            return { url: links };
        };
    }

    query.queryConfig(queryConfigObject);

    let response = await getResponse(query, config);
    response = extendLinkedItems(response);

    if (response && response.items) {
        return response.items;
    }
    if (response && response.type) {
        return response.type;
    }

    return response;
};

module.exports = requestDelivery;
