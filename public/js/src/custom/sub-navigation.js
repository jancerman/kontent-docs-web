/**
 * Article sub-navigation
 */
(() => {
    // On click 2nd level of the sub-navigation make the 3rd level collapse
    const toggleLevel2 = () => {
        let level2 = document.querySelector('.sub-navigation--level-2');
        
        if (level2) {
            level2.addEventListener('click', event => {
                if (event.target && event.target.classList.contains('sub-navigation__link')) {
                    var isLevel3 = false;
    
                    helper.getParents(event.target).forEach(item => {
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
                }
            });
        }
    };

    // Make the sub-navigation fixed to top/bottom of the sreen, or to header/footer 
    const fixSubNav = () => {
        let subNavigation = document.querySelector('.sub-navigation.sub-navigation--level-1');
        let viewportWidth = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);

        if (viewportWidth >= 768 && subNavigation) {
            let topOffset = ((window.pageYOffset || document.scrollTop) - (document.clientTop || 0)) || 0;
            let isTop = topOffset <= document.querySelector('.navigation').offsetHeight;

            let isBottom = (window.innerHeight + window.pageYOffset + helper.outerHeight(document.querySelector('.footer'))) >= document.body.offsetHeight;

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

    window.addEventListener('scroll', fixSubNav, supportsPassive ? { passive: true } : false);
})();