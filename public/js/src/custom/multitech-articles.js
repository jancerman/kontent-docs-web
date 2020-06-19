window.initMultitechQS = (() => {
    const getFirtPlatformUrl = (href) => {
        let firstPlatformUrl = href;
        let nextUrlMapItem;

        for (let i = 0; i < window.urlMap.length; i++) {
            if (window.urlMap[i].url === href) {
                nextUrlMapItem = window.urlMap[i + 1];
                if (nextUrlMapItem && nextUrlMapItem.url.indexOf(href) > -1 && nextUrlMapItem.url.indexOf('?tech=') > -1) {
                    firstPlatformUrl = nextUrlMapItem.url;
                }
            }
        }

        return firstPlatformUrl;
    };

    return () => {
        const techLinks = document.querySelectorAll('a[href*="?tech={tech}"]');

        if (!techLinks.length) return;

        const preselectedPlatform = window.helper.getCookie('KCDOCS.preselectedLanguage');

        const tech = window.helper.getTech(preselectedPlatform) || '';

        let toReplace = '{tech}';
        if (!tech) {
            toReplace = '?tech={tech}';
        }

        for (let i = 0; i < techLinks.length; i++) {
            let href = techLinks[i].getAttribute('href').replace(toReplace, tech);

            if (href.indexOf('?tech=') === -1) {
                href = getFirtPlatformUrl(href);
            }

            techLinks[i].setAttribute('data-multitech', '');
            techLinks[i].setAttribute('href', href);
        };
    };
})();

window.updateMultitechQS = () => {
    const techLinks = document.querySelectorAll('[data-multitech]');

    if (!techLinks.length) return;

    const preselectedPlatform = window.helper.getCookie('KCDOCS.preselectedLanguage');

    const tech = window.helper.getTech(preselectedPlatform) || '';

    for (let i = 0; i < techLinks.length; i++) {
        const href = techLinks[i].getAttribute('href');
        techLinks[i].setAttribute('href', window.helper.replaceUrlParam(href, 'tech', tech));
    }
};
