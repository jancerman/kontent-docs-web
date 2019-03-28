(() => {
    const highlightSelector = (selector, e) => {  
        if (e) {  
            helper.setCookie('KCDOCS.preselectedLanguage', e.target.getAttribute('data-platform'));
            selector.querySelectorAll('.language-selector__link--active').forEach(item => item.classList.remove('language-selector__link--active'));
            e.target.classList.add('language-selector__link--active');
        } else {
            let preselectedPlatform = helper.getCookie('KCDOCS.preselectedLanguage');
            let preselectedElem = document.querySelector(`[data-platform="${preselectedPlatform}"]`);

            if (preselectedPlatform && preselectedElem) {
                preselectedElem.classList.add('language-selector__link--active');
            } else {
                let firstPlatformElem = document.querySelector('.language-selector__link');
                helper.setCookie('KCDOCS.preselectedLanguage', firstPlatformElem.getAttribute('data-platform'));
                firstPlatformElem.classList.add('language-selector__link--active'); 
            }
        }
    };

    const getSelectedPlatform = (e) => {
        let selectedPlatform;

        if (e) {
            selectedPlatform = e.target.getAttribute('data-platform');
        } else {
            selectedPlatform = document.querySelector('.language-selector__link--active').getAttribute('data-platform');
        }

        return selectedPlatform;
    };

    const selectCode = (e) => {
        let selectedPlatform = getSelectedPlatform(e);

        document.querySelectorAll('[data-platform-code]').forEach(item => item.classList.add('hidden'));
        document.querySelectorAll(`[data-platform-code="${selectedPlatform}"]`).forEach(item => item.classList.remove('hidden'));
    };

    const switchContentChunk = (e) => {
        let selectedPlatform = getSelectedPlatform(e);
        document.querySelectorAll('[data-platform-chunk]').forEach(item => item.classList.add('hidden'));
        document.querySelectorAll(`[data-platform-chunk*="${selectedPlatform}"], [data-platform-chunk=""]`).forEach(item => item.classList.remove('hidden'));
    };

    const selectLanguage = () => {
        let selector = document.querySelector('.language-selector__list:not(.language-selector__list--static)');

        if (selector) {
            highlightSelector();
            selectCode();
            switchContentChunk();
    
            selector.addEventListener('click', (e) => {
                if (e.target && e.target.matches('.language-selector__link')) {
                    e.preventDefault();
                    highlightSelector(selector, e);
                    selectCode(e);
                    switchContentChunk(e);
                    replaceLanguageInUrl(e);
                }
            });
        }
    };

    const replaceLanguageInUrl = (e) => {
        let selectedPlatform = e.target.getAttribute('data-slug');

        let url = window.location;
        let path = url.pathname.split('/');
        path.pop();
        path.push(selectedPlatform);

        path = path.join('/') + url.search + url.hash;

        if (history && history.replaceState) {
            history.replaceState({}, null, path);
        }
    };

    selectLanguage();
})();