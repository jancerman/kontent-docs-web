const loadOnScroll = () => {
    var lazyloadElems;

    if ('IntersectionObserver' in window) {
        lazyloadElems = document.querySelectorAll('.lazy');

        var elemObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    var elem = entry.target;
                    if (elem.classList.contains('lazy') && elem.hasAttribute('data-src')) {
                        elem.src = elem.dataset.src;
                        elem.classList.remove('lazy');
                        elem.removeAttribute('data-src');
                        elemObserver.unobserve(elem);
                    }
                }
            });
        });

        lazyloadElems.forEach((elem) => {
            elemObserver.observe(elem);
        });
    } else {
        var lazyloadThrottleTimeout;
        lazyloadElems = document.querySelectorAll('.lazy');

        var lazyload = () => {
            if (lazyloadThrottleTimeout) {
                clearTimeout(lazyloadThrottleTimeout);
            }

            lazyloadThrottleTimeout = setTimeout(() => {
                var scrollTop = window.pageYOffset;
                lazyloadElems.forEach((el) => {
                    let offsetTop = el.offsetTop === 0 ? el.offsetParent.offsetTop : el.offsetTop;

                    if (offsetTop < (window.innerHeight + scrollTop)) {
                        if (el.classList.contains('lazy') && el.hasAttribute('data-src')) {
                            el.src = el.dataset.src;
                            el.classList.remove('lazy');
                            el.removeAttribute('data-src');
                        }
                    }
                });
                if (lazyloadElems.length === 0) {
                    document.removeEventListener('scroll', lazyload);
                    window.removeEventListener('resize', lazyload);
                    window.removeEventListener('orientationChange', lazyload);
                }
            }, 20);
        }

        document.addEventListener('scroll', lazyload, supportsPassive ? { passive: true } : false);
        window.addEventListener('resize', lazyload);
        window.addEventListener('orientationChange', lazyload);
    }
};

const loadFonts = () => {
    helper.addStylesheet('https://fonts.googleapis.com/css?family=Source+Sans+Pro:300,400,400i,700');

    if (document.querySelector('code, pre')) {
        helper.addStylesheet('https://fonts.googleapis.com/css?family=Inconsolata');
    }
};

document.addEventListener('DOMContentLoaded', () => {
    loadFonts();
    loadOnScroll();
});