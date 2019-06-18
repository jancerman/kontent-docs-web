(() => {
    const form = document.querySelector('.feedback__form');
    if (form) {
        const submitButton = form.querySelector('.form__button');
        const recaptchaCover = form.querySelector('.form__recaptcha-disabled');

        const collectData = () => {
            var data = {};
            data.feedback = form.querySelector('#feedback').value;
            data.email = form.querySelector('#email').value;
            data['g-recaptcha-response'] = grecaptcha.getResponse();
            data.url = window.location.href;
            return data;
        };

        const clearMessages = () => {
            document.querySelector(`.feedback__message`).classList.add('feedback__message--hidden');
            form.querySelectorAll('[data-form-error]').forEach((item) => {
                item.innerHTML = '';
            });
        };

        const displaySuccessMessage = () => {
            document.querySelector(`.feedback__message--yes`).classList.remove('feedback__message--hidden');
            document.querySelector(`.feedback__message--no`).classList.add('feedback__message--hidden');
        };

        const processData = (data) => {
            helperForm.enableInputs(form, recaptchaCover);
            helperForm.removeLoadingFromButton(submitButton);
            grecaptcha.reset();

            if (data.isValid) {
                helperForm.clearForm(form);
                helperForm.hideForm(form);
                displaySuccessMessage();
            } else {
                helperForm.displayValidationMessages(data, form);
            }
        };

        submitButton.addEventListener('click', (e) => {
            e.preventDefault();

            helperForm.validateAndSubmitForm(form, e.target, () => {
                clearMessages();
                helperForm.disableInputs(form, recaptchaCover);
                helperForm.addLoadingToButton(submitButton);
                var data = collectData();
                helperForm.submitData('/form/feedback', data, processData);
            });
        });
    }
})();