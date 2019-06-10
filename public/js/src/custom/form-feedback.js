(() => {
    const form = document.querySelector('.feedback__form');
    if (form) {
        const submitButton = form.querySelector('.form__button');
        const recaptchaCover = form.querySelector('.form__recaptcha-disabled');

        const disableInputs = () => {
            form.querySelectorAll('.form__input').forEach((item) => {
                item.setAttribute('disabled', 'disabled');
            });

            recaptchaCover.classList.add('form__recaptcha-disabled--visible');
        };

        const enableInputs = () => {
            form.querySelectorAll('.form__input').forEach((item) => {
                item.removeAttribute('disabled');
            });

            recaptchaCover.classList.remove('form__recaptcha-disabled--visible');
        };

        const addLoadingToButton = () => {
            submitButton.classList.add('form__button--loading');
        };

        const removeLoadingFromButton = () => {
            submitButton.classList.remove('form__button--loading');
        };

        const collectData = () => {
            var data = {};
            data.feedback = form.querySelector('#feedback').value;
            data.email = form.querySelector('#email').value;
            data['g-recaptcha-response'] = grecaptcha.getResponse();
            data.url = window.location.href;
            return data;
        };

        const submitData = (data, callback) => {
            return helper.ajaxPost('/form/feedback', data, callback, 'json');
        };

        const clearForm = () => {
            form.querySelectorAll('.form__input').forEach((item) => {
                item.value = '';
            });
        };

        const clearMessages = () => {
            document.querySelector(`.feedback__message`).classList.add('feedback__message--hidden');
            form.querySelectorAll('[data-form-error]').forEach((item) => {
                item.innerHTML = '';
            });
        };

        const displayValidationMessages = (data) => {
            for (var item in data) {
                if (data.hasOwnProperty(item)) {
                    let errorElem = form.querySelector(`[data-form-error="${item}"]`);
                    if (errorElem) {
                        errorElem.innerHTML = data[item];
                    }
                }
            }
        };

        const displaySuccessMessage = () => {
            document.querySelector(`.feedback__message--yes`).classList.remove('feedback__message--hidden');
            document.querySelector(`.feedback__message--no`).classList.add('feedback__message--hidden');
        };

        const hideForm = () => {
            form.classList.add('form--hidden');
        };

        const processData = (data) => {
            enableInputs();
            removeLoadingFromButton();
            grecaptcha.reset();

            if (data.isValid) {
                clearForm();
                hideForm();
                displaySuccessMessage();
            } else {
                displayValidationMessages(data);
            }
        };

        submitButton.addEventListener('click', (e) => {
            e.preventDefault();

            if (!submitButton.classList.contains('form__button--loading')) {
                clearMessages();
                disableInputs();
                addLoadingToButton();
                var data = collectData();
                submitData(data, processData);
            }
        });
    }
})();