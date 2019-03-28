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
    },
    getPrismClassName: (item) => {
        let lang = 'lang-';
        if (item) {
            switch (item.codename) {
                case 'rest':
                    lang += 'shell';
                    break;
                case 'shell':
                    lang += 'shell';
                    break;
                case 'curl':
                    lang += 'shell';
                    break;
                case '_net':
                    lang += 'dotnet';
                    break;
                case 'javascript':
                    lang += 'js';
                    break;
                case 'typescript':
                    lang += 'ts';
                    break;
                case 'java':
                    lang += 'java';
                    break;
                case 'javarx':
                    lang += 'java';
                    break;
                case 'php':
                    lang += 'php';
                    break;
                case 'swift':
                    lang += 'swift';
                    break;
                case 'python':
                    lang += 'python';
                    break;
                case 'ruby':
                    lang += 'ruby';
                    break;
                default:
                    lang += 'clike';
            };
        } else {
            lang += 'clike';
        }

        return lang;
    }
};

module.exports = helper;
