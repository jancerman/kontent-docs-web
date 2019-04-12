(() => {
    let yesBtn = document.querySelector('.feedback__button--yes');
    let noBtn = document.querySelector('.feedback__button--no');
    let yesMsg = document.querySelector('.feedback__message--yes');
    let noMsg = document.querySelector('.feedback__message--no');
    let btnArea = document.querySelector('.feedback__answer');

    if (yesMsg && noMsg) {
        yesMsg.classList.add('feedback__message--hidden');
        noMsg.classList.add('feedback__message--hidden');
    }
    const sendFeedback = (value) => {
        window.dataLayer.push({
            'event': 'event',
            'eventCategory': 'feedback--submitted',
            'eventAction': 'Click',
            'eventLabel': window.location.pathname,
            'eventValue': value
        });
    };

    const onBtnClick = (btn, msg, value) => {
        btnArea.removeEventListener('click', handleFeedback);
        btnArea.classList.add('feedback__answer--answered');
        btn.classList.add('feedback__button--active')
        msg.classList.remove('feedback__message--hidden');
        sendFeedback(value);
    };

    const handleFeedback = (e) => {
        e.preventDefault();
        if (e.target) {
            if (e.target.matches('.feedback__button--yes')) {
                onBtnClick(yesBtn, yesMsg, 1);
            } else if (e.target.matches('.feedback__button--no')) {
                onBtnClick(noBtn, noMsg, 0);
            }
        }
    };

    if (yesMsg && noMsg) {
        btnArea.addEventListener('click', handleFeedback)
    }
})();