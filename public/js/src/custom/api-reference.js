window.onload = function () {

    var setCookie = (name, value, days) => {
        var expires = '';
        if (days) {
            var date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            expires = '; expires=' + date.toUTCString();
        }
        document.cookie = name + '=' + (value || '') + expires + '; path=/';
    };

    var getCookie = (name) => {
        var nameEQ = name + '=';
        var ca = document.cookie.split(';');
        for (var i = 0; i < ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0) === ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
        }
        return null;
    };

    var triggerClick = function (item) {
        setTimeout(function () {
            item.click();
        }, 0);
    };

    var initPlatfromFromCookie = function () {
        var clicked = false;

        var cookie = getCookie('KCDOCS.preselectedLanguage');

        if (cookie && !clicked) {
            var tabs = document.querySelectorAll('[class*="tab-click_' + cookie + '"]');
            for (var i = 0; i < tabs.length; i++) {
                clicked = true;
                triggerClick(tabs[i]);
            }

            setTimeout(function () {
                clicked = false;
            }, 0);
        }
    };

    var savePlatformToCookie = function (className) {
        var classNames = className.split(' ');
        var platform = '';
        for (var i = 0; i < classNames.length; i++) {
            if (classNames[i].indexOf('tab-click_') > -1) {
                platform = classNames[i].replace('tab-click_', '');
            }
        }

        setCookie('KCDOCS.preselectedLanguage', platform);
    };

    var clickTab = function () {
        var tabs = document.querySelectorAll('[class*="tab-click_"]');
        var body = document.querySelector('body');
        var clicked = false;

        var interval = setInterval(function () {
            tabs = document.querySelectorAll('[class*="tab-click_"]');
            if (tabs.length) {
                initPlatfromFromCookie();
                clearInterval(interval);
            }
        }, 100);

        body.addEventListener('click', function (e) {
            if (e.target && e.target.className.indexOf('tab-click_') > -1 && !clicked) {
                var className;

                savePlatformToCookie(e.target.className);

                if (!tabs.length) {
                    tabs = document.querySelectorAll('[class*="tab-click_"]');
                }

                for (var i = 0; i < e.target.classList.length; i++) {
                    if (e.target.classList[i].indexOf('tab-click_') > -1) {
                        className = e.target.classList[i];
                    }
                }

                for (var i = 0; i < tabs.length; i++) {
                    if (tabs[i].classList.contains(className) && tabs[i] !== e.target) {
                        clicked = true;
                        triggerClick(tabs[i]);
                    }
                }

                setTimeout(function () {
                    clicked = false;
                }, 0);
            }
        });
    };

    clickTab();
};