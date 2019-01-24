const { DeliveryClient } = require('kentico-cloud-delivery');
const { deliveryConfig } = require('../config');

const richTextResolverTemplates = require('./richTextResolverTemplates');
const linksResolverTemplates = require('./linksResolverTemplates');
    
deliveryConfig.projectId = process.env['KC.ProjectId'];

if (process.env['KC.PreviewApiKey']) {
    deliveryConfig.previewApiKey = process.env['KC.PreviewApiKey'];
    deliveryConfig.enablePreviewMode = true;
}
  
const deliveryClient = new DeliveryClient(deliveryConfig);

const requestDelivery = async (config) => {
    const query = deliveryClient.items()
        .type(config.type);
    
        config.depth && query.depthParameter(config.depth);
        config.slug && query.equalsFilter('elements.url', config.slug);

    if (config.resolveRichText) {
        query.queryConfig({
            richTextResolver: (item, context) => {
                if (item.system.type === 'embedded_content') {
                    return richTextResolverTemplates.embeddedContent(item);
                } else if (item.system.type === 'signpost') {
                    return richTextResolverTemplates.signpost(item);
                } else if (item.system.type === 'callout') {
                    return richTextResolverTemplates.callout(item);
                } else {
                    return `Missing Rich text resolver for the ${item.system.type} type.`;
                }
            },
            linkResolver: (link) => {
                if ((link.type === 'article' || link.type === 'scenario') && config.urlMap && config.urlMap.length) {
                    return linksResolverTemplates.article(link, config.urlMap);
                } else {
                    return `/`;
                }
            }
        });
    }

    const response = await query
        .getPromise();

    if (config.resolveRichText) {
        response.items.forEach((elem) => {
            Object.keys(elem)
                .filter((key) => elem.hasOwnProperty(key) && elem[key].hasOwnProperty('type') && elem[key].type === `rich_text`)
                .forEach((key) => {
                    elem[key].getHtml();
                    elem[key].value = elem[key].resolvedHtml;
                });
        });
    }
      
    return response.items;
};

module.exports = requestDelivery;