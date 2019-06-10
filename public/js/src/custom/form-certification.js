(() => {
    const form = document.querySelector('.form__certification');
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
            var companyField = form.querySelector('#custom_field_1');

            if (companyField) {
                data.custom_field_1 = companyField.value;
            }

            data.course_id = form.querySelector('#course_id').value;
            data.first_name = form.querySelector('#first_name').value;
            data.last_name = form.querySelector('#last_name').value;
            data.email = form.querySelector('#email').value;
            data['g-recaptcha-response'] = grecaptcha.getResponse();

            return data;
        };

        const submitData = (data, callback) => {
            return helper.ajaxPost('/form/certification', data, callback, 'json');
        };

        const clearForm = () => {
            form.querySelectorAll('.form__input').forEach((item) => {
                item.value = '';
            });
        };

        const clearMessages = () => {
            form.querySelectorAll('[data-form-error]').forEach((item) => {
                item.innerHTML = '';
            });
            document.querySelector('[data-form-warning]').innerHTML = '';
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

        const displaySuccessMessage = (data) => {
            document.querySelector('[data-form-success]').innerHTML = data.success;
        };

        const displayWarningMessage = (data) => {
            document.querySelector('[data-form-warning]').innerHTML = data.warning;
        };

        const hideForm = () => {
            form.classList.add('form--hidden');
        };

        const processData = (data) => {
            enableInputs();
            removeLoadingFromButton();
            grecaptcha.reset();

            if (data.isValid) {
                if (data.warning) {
                    displayWarningMessage(data);
                }

                if (data.success) {
                    clearForm();
                    hideForm();
                    displaySuccessMessage(data);
                }
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