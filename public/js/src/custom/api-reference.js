(() => {
    const redoc = document.querySelector('#redoc');
    const tabSelector = '[class*="tab-click_"]';

    const triggerClick = function (item) {
        setTimeout(() => {
            item.click();
        }, 0);
    };

    const clickTab = function () {
        let tabs = document.querySelectorAll(tabSelector);
        let clicked = false;

        redoc.addEventListener('click', (e) => {
            if (e.target && e.target.matches(tabSelector) && !clicked) {
                let className;

                if (!tabs.length) {
                    tabs = document.querySelectorAll(tabSelector);
                }

                for (let i = 0; i < e.target.classList.length; i++) {
                    if (e.target.classList[i].indexOf('tab-click_') > -1) {
                        className = e.target.classList[i];
                    }
                }

                for (let i = 0; i < tabs.length; i++) {
                    if (tabs[i].classList.contains(className) && tabs[i] !== e.target) {
                        clicked = true;
                        triggerClick(tabs[i]);
                    }
                }

                setTimeout(() => {
                    clicked = false;
                }, 0);

                /*var idName = e.target.innerHTML.replace(/\./g, '_').replace('tab-click_', '').toLowerCase();
                helper.setCookie('KCDOCS.preselectedLanguage', idName);*/
            }
        });
    };

    clickTab();

})();