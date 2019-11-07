/**
 * Article sub-navigation
 */
(() => {
    // On click 2nd level of the sub-navigation make the 3rd level collapse
    const actionOnLevel2 = (event) => {
        var isLevel3 = false;

        window.helper.getParents(event.target).forEach(item => {
            if (item && item.classList && item.classList.contains('sub-navigation--level-3')) {
                isLevel3 = true;
            }
        });

        if (!isLevel3) {
            event.preventDefault();

            if (event.target.classList.contains('sub-navigation__link--active')) {
                event.target.classList.remove('sub-navigation__link--active');
            } else {
                event.target.classList.add('sub-navigation__link--active');
            }
        }
    };

    const toggleLevel2 = () => {
        const level2 = document.querySelector('.sub-navigation--level-2');

        if (level2) {
            level2.addEventListener('click', event => {
                if (event.target && event.target.classList.contains('sub-navigation__link')) {
                    actionOnLevel2(event);
                }
            });
        }
    };

    // Make the sub-navigation fixed to top/bottom of the sreen, or to header/footer
    const fixSubNav = () => {
        const subNavigation = document.querySelector('.sub-navigation.sub-navigation--level-1');
        const viewportWidth = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);

        if (viewportWidth >= 768 && subNavigation) {
            const topOffset = ((window.pageYOffset || document.scrollTop) - (document.clientTop || 0)) || 0;
            const isTop = topOffset <= document.querySelector('.navigation').offsetHeight;

            const isBottom = (window.innerHeight + window.pageYOffset + window.helper.outerHeight(document.querySelector('.footer'))) >= document.body.offsetHeight;

            if (isTop) {
                subNavigation.classList.add('sub-navigation--top');
            } else {
                subNavigation.classList.remove('sub-navigation--top');
            }

            if (isBottom) {
                subNavigation.classList.add('sub-navigation--bottom');
            } else {
                subNavigation.classList.remove('sub-navigation--bottom');
            }
        }
    };

    toggleLevel2();
    fixSubNav();

    window.addEventListener('scroll', fixSubNav, window.supportsPassive ? { passive: true } : false);
})();
