const helper = {
    escapeHtml: (unsafe) => {
        return unsafe
             .replace(/&/g, '&amp;')
             .replace(/</g, '&lt;')
             .replace(/>/g, '&gt;')
             .replace(/'/g, '&quot;')
             .replace(/"/g, '&quot;')
             .replace(/'/g, '&#039;');
     },
     removeNewLines: (unsafe) => {
        return unsafe.replace(/\r?\n|\r/g, '');
     },
     getFormValue: (formValues, fieldName) => {
        var value = '';
        if (typeof formValues !== 'undefined') {
            value = formValues[fieldName] || '';
        }
        return value;
    },
    getValidationMessages: (errors, data) => {
        errors.forEach((item) => {
            if (item.msg) {
                if (data.content[item.msg] && data.content[item.msg].value) {
                    item.msg = data.content[item.msg].value;
                }
            }
        });

        return errors;
    }
};

module.exports = helper;
