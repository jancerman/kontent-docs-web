(() => {
    const highlightSelector = (selector, e) => {  
        if (e) {  
            helper.setCookie('KCDOCS.preselectedLanguage', e.target.getAttribute('data-platform'));
            selector.querySelectorAll('.language-selector__link--active').forEach(item => item.classList.remove('language-selector__link--active'));
            e.target.classList.add('language-selector__link--active');
        } else {
            if (!helper.getCookie('KCDOCS.preselectedLanguage')) {
                let firstPlatformElem = document.querySelector('.language-selector__link');
                helper.setCookie('KCDOCS.preselectedLanguage', firstPlatformElem.getAttribute('data-platform'));
                firstPlatformElem.classList.add('language-selector__link--active');
            } else {
                document.querySelector(`[data-platform=${helper.getCookie('KCDOCS.preselectedLanguage')}]`).classList.add('language-selector__link--active');
            }
        }
    };

    const selectCode = (e) => {
        let selectedPlatform;

        if (e) {
            selectedPlatform = e.target.getAttribute('data-platform');
        } else {
            selectedPlatform = document.querySelector('.language-selector__link--active').getAttribute('data-platform');
        }
        
        document.querySelectorAll('[data-platform-code]').forEach(item => item.classList.add('hidden'));
        document.querySelectorAll(`[data-platform-code="${selectedPlatform}"]`).forEach(item => item.classList.remove('hidden'));
    };

    const selectLanguage = () => {
        let selector = document.querySelector('.language-selector__list');

        highlightSelector();
        selectCode();

        selector.addEventListener('click', (e) => {
            if (e.target && e.target.matches('.language-selector__link')) {
                e.preventDefault();
                highlightSelector(selector, e);
                selectCode(e);
            }
        });
    };

    selectLanguage();
})();