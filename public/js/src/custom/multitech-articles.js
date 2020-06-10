(() => {
    const initMultitechQS = () => {
        const techLinks = document.querySelectorAll('a[href*="?tech={tech}"]');

        if (!techLinks.length) return;

        const preselectedPlatform = window.helper.getCookie('KCDOCS.preselectedLanguage');
        const tech = window.helper.getTech(preselectedPlatform) || '';

        let toReplace = '{tech}';
        if (!tech) {
            toReplace = '?tech={tech}';
        }

        for (let i = 0; i < techLinks.length; i++) {
            const href = techLinks[i].getAttribute('href').replace(toReplace, tech);
            techLinks[i].setAttribute('data-multitech', '');
            techLinks[i].setAttribute('href', href);
        };
    };

    initMultitechQS();
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
