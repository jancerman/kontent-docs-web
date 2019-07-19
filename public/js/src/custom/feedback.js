(() => {
    let yesBtn = document.querySelector('.feedback__button--yes');
    let noBtn = document.querySelector('.feedback__button--no');
    let yesMsg = document.querySelector('.feedback__message--yes');
    let noMsg = document.querySelector('.feedback__message--no');
    let btnArea = document.querySelector('.feedback__answer');
    let form = document.querySelector('.feedback__form');
    let posted = document.querySelector('.feedback--posted');
    let onBtnClick, handleFeedback;

    const sendFeedback = (value) => {
        window.dataLayer.push({
            'event': 'event',
            'eventCategory': 'feedback--submitted',
            'eventAction': 'Click',
            'eventLabel': window.location.pathname,
            'eventValue': value
        });
    };

    handleFeedback = (e) => {
        e.preventDefault();
        if (e.target) {
            if (e.target.matches('.feedback__button--yes')) {
                onBtnClick(yesBtn, yesMsg, 1);
            } else if (e.target.matches('.feedback__button--no')) {
                onBtnClick(noBtn, noMsg, 0);
            }
        }
    };

    onBtnClick = (btn, msg, value) => {
        btnArea.removeEventListener('click', handleFeedback);
        btnArea.classList.add('feedback__answer--answered');
        btn.classList.add('feedback__button--active');

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
})();
