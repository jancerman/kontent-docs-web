(() => {
    window.helper.fixElem('.aside', 'aside');

    window.addEventListener('scroll', () => {
        window.helper.fixElem('.aside', 'aside');
    }, window.supportsPassive ? { passive: true } : false);
})();
