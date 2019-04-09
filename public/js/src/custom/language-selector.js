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

    const toggleBlock = (e, attribute, allowEmpty) => {
        let selectedPlatform = getSelectedPlatform(e);
        let selectorToGetVisible = `[${attribute}*="${selectedPlatform}"]`;

        if (allowEmpty) {
            selectorToGetVisible += `, [${attribute}=""]`;
        }
        document.querySelectorAll(`[${attribute}]`).forEach(item => item.classList.add('hidden'));
        document.querySelectorAll(selectorToGetVisible).forEach(item => item.classList.remove('hidden'));
    }

    const selectCode = (e) => {
        toggleBlock(e, 'data-platform-code', false);
    };

    const switchContentChunk = (e) => {
        toggleBlock(e, 'data-platform-chunk', true);
    };

    const selectLanguageOnClick = (selector) => {
        const actionOnClick = (e, selector) => {
            highlightSelector(selector, e);
            selectCode(e);
            switchContentChunk(e);
            replaceLanguageInUrl(e);
            document.querySelectorAll(`pre[data-platform-code=${e.target.getAttribute('data-platform')}] code`).forEach((item) => {
                Prism.highlightElement(item);
            });
        };

        selector.addEventListener('click', (e) => {
            if (e.target && e.target.matches('.language-selector__link')) {
                e.preventDefault();
                actionOnClick(e, selector);
            }
        });
    };

    const selectLanguage = () => {
        let selector = document.querySelector('.language-selector__list:not(.language-selector__list--static)');

        if (selector) {
            highlightSelector();
            selectCode();
            switchContentChunk();
            selectLanguageOnClick(selector);
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