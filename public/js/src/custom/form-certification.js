(() => {
    const form = document.querySelector('.form__certification');
    if (form) {
        const submitButton = form.querySelector('.form__button');
        const recaptchaCover = form.querySelector('.form__recaptcha-disabled');

        const collectData = () => {
            var data = {};
            var companyField = form.querySelector('#custom_field_1');

            if (companyField) {
                data.custom_field_1 = companyField.value;
            }

            data.course_id = form.querySelector('#course_id').value;
            data.first_name = form.querySelector('#first_name').value;
            data.last_name = form.querySelector('#last_name').value;
            data.email = form.querySelector('#email').value;
            data['g-recaptcha-response'] = window.grecaptcha.getResponse();

            return data;
        };

        const clearMessages = () => {
            form.querySelectorAll('[data-form-error]').forEach((item) => {
                item.innerHTML = '';
            });
            document.querySelector('[data-form-warning]').innerHTML = '';
        };

        const displaySuccessMessage = (data) => {
            document.querySelector('[data-form-success]').innerHTML = data.success;
        };

        const displayWarningMessage = (data) => {
            document.querySelector('[data-form-warning]').innerHTML = data.warning;
        };

        const processData = (data) => {
            window.helperForm.enableInputs(form, recaptchaCover);
            window.helperForm.removeLoadingFromButton(submitButton);
            window.grecaptcha.reset();

            if (data.isValid) {
                if (data.warning) {
                    displayWarningMessage(data);
                }

                if (data.success) {
                    window.helperForm.clearForm(form);
                    window.helperForm.hideForm(form);
                    displaySuccessMessage(data);
                }
            } else {
                window.helperForm.displayValidationMessages(data, form);
            }
        };

        const submitForm = () => {
            window.helperForm.submitForm({
                clearMessages: clearMessages,
                form: form,
                recaptchaCover: recaptchaCover,
                processData: processData,
                submitButton: submitButton,
                collectData: collectData,
                endpoint: '/form/certification'
            });
        };

        submitButton.addEventListener('click', (e) => {
            e.preventDefault();
            window.helperForm.validateAndSubmitForm(form, e.target, submitForm);
        });
    }
})();
