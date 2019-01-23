const linksResolverTemplates = {
    article: (item, urlMap) => {
        return urlMap.filter(elem => elem.codename === item.codename)[0].url;
    }       
};

module.exports = linksResolverTemplates;