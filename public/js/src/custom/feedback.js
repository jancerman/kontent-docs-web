(() => {
    const yesBtn = document.querySelector('.feedback__button--yes');
    const noBtn = document.querySelector('.feedback__button--no');
    const yesMsg = document.querySelector('.feedback__message--yes');
    const noMsg = document.querySelector('.feedback__message--no');
    const btnArea = document.querySelector('.feedback__answer');
    const form = document.querySelector('.feedback__form');
    const wrapper = document.querySelector('.feedback__response-wrapper');
    const close = document.querySelector('.feedback__close');
    const posted = document.querySelector('.feedback--posted');

    const setTopOffset = (elem) => {
        const toc = document.querySelector('.table-of-contents--fixed');

        if (toc) {
            const tocHeading = toc.querySelector('.table-of-contents__heading');
            const tocList = toc.querySelector('.table-of-contents__list');
            const tocOffset = toc.getBoundingClientRect().top;

            const offset = tocHeading.offsetHeight + tocList.offsetHeight + tocOffset + 32;
            elem.style.top = `${offset}px`;
        }
    };

    const handleFixed = () => {
        const selector = document.querySelector('.feedback');
        const viewportWidth = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);

        if (viewportWidth >= 1150 && selector) {
            let isTop = false;

            if (!document.querySelector('[data-display-mode-wrapper]')) {
                const topOffset = ((window.pageYOffset || document.scrollTop) - (document.clientTop || 0)) || 0;
                const main = document.querySelector('.article__content .table-of-contents:not(.hidden):not(.table-of-contents--fixed)') || document.querySelector('.article__filter') || document.querySelector('.article__notes');
                isTop = topOffset <= (main.getBoundingClientRect().top || 0) + main.offsetHeight + (window.scrollY || document.documentElement.scrollTop);
            }

            if (isTop) {
                selector.classList.remove('feedback--visible');
            } else {
                setTopOffset(selector);
                selector.classList.add('feedback--visible');
            }
        }
    };

    const sendFeedback = (value) => {
        if (!window.dataLayer) {
            window.dataLayer = [];
        }

        if (window.dataLayer) {
            window.dataLayer.push({
                event: 'event',
                eventCategory: 'feedback--submitted',
                eventAction: 'Click',
                eventLabel: window.location.pathname,
                eventValue: value
            });
        }
    };

    const handleFeedback = (e) => {
        e.preventDefault();
        if (e.target) {
            if (e.target.matches('.feedback__button--yes') || e.target.matches('.feedback__button--yes span')) {
                onBtnClick(yesBtn, yesMsg, 1);
            } else if (e.target.matches('.feedback__button--no') || e.target.matches('.feedback__button--no span')) {
                onBtnClick(noBtn, noMsg, 0);
            }
        }
    };

    const onBtnClick = (btn, msg, value) => {
        btnArea.removeEventListener('click', handleFeedback);
        btnArea.classList.add('feedback__answer--answered');
        btn.classList.add('feedback__button--active');
        wrapper.classList.remove('feedback__response-wrapper--hidden');

        if (msg) {
            msg.classList.remove('feedback__message--hidden');
        }

        if (!posted) {
            sendFeedback(value);
        }

        if (form && value === 0) {
            form.classList.remove('feedback__form--hidden');
            window.helper.loadRecaptcha();
        }
    };

    const closeFeedback = () => {
        if (close) {
            close.addEventListener('click', () => {
                wrapper.classList.add('feedback__response-wrapper--hidden');
                noBtn.classList.add('feedback__button--closed');
                yesBtn.classList.add('feedback__button--closed');
            });
        }
    };

    if (form) {
        window.addEventListener('scroll', handleFixed, window.supportsPassive ? {
            passive: true
        } : false);
        window.addEventListener('resize', handleFixed, window.supportsPassive ? {
            passive: true
        } : false);
    }

    if (yesMsg && noMsg && !posted) {
        btnArea.addEventListener('click', handleFeedback)
    }

    if (yesMsg && noMsg) {
        yesMsg.classList.add('feedback__message--hidden');
        noMsg.classList.add('feedback__message--hidden');
    }

    if (form && !posted) {
        form.classList.add('feedback__form--hidden');
    }

    if (posted) {
        onBtnClick(noBtn, noMsg, 0);

        if (form) {
            form.classList.remove('feedback__form--hidden');
        }
    }

    closeFeedback();
})();
