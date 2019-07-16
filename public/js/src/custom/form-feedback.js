(() => {
    const formFeedback = document.querySelector('.feedback__form');
    if (formFeedback) {
        const submitButtonFeedback = formFeedback.querySelector('.form__button');
        const recaptchaCoverFeedback = formFeedback.querySelector('.form__recaptcha-disabled');

        const collectFeedbackData = () => {
            var data = {};
            data.feedback = formFeedback.querySelector('#feedback').value;
            data.email = formFeedback.querySelector('#email').value;
            data['g-recaptcha-response'] = grecaptcha.getResponse();
            data.url = window.location.href;
            return data;
        };

        const clearFeedbackMessages = () => {
            document.querySelector(`.feedback__message`).classList.add('feedback__message--hidden');
            formFeedback.querySelectorAll('[data-form-error]').forEach((item) => {
                item.innerHTML = '';
            });
        };

        const displaySuccessMessage = () => {
            document.querySelector(`.feedback__message--yes`).classList.remove('feedback__message--hidden');
            document.querySelector(`.feedback__message--no`).classList.add('feedback__message--hidden');
        };

        const processFeedbackData = (data) => {
            helperForm.enableInputs(formFeedback, recaptchaCoverFeedback);
            helperForm.removeLoadingFromButton(submitButtonFeedback);
            grecaptcha.reset();

            if (data.isValid) {
                helperForm.clearForm(formFeedback);
                helperForm.hideForm(formFeedback);
                displaySuccessMessage();
            } else {
                helperForm.displayValidationMessages(data, formFeedback);
            }
        };

        const submitFeedbackForm = () => {
            helperForm.submitForm({
                clearMessages: clearFeedbackMessages,
                form: formFeedback,
                recaptchaCover: recaptchaCoverFeedback,
                processData: processFeedbackData,
                submitButton: submitButtonFeedback,
                collectData: collectFeedbackData,
                endpoint: '/form/feedback'
            });
        };

        submitButtonFeedback.addEventListener('click', (e) => {
            e.preventDefault();
            helperForm.validateAndSubmitForm(formFeedback, e.target, submitFeedbackForm);
        });
    }
})();
