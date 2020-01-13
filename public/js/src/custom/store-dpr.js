(() => {
    const getDevicePixelRatio = () => {
        return window.devicePixelRatio || 1;
    };

    window.helper.setCookie('KCDOCS.dpr', getDevicePixelRatio());
})();
