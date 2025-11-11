(function() {
    'use strict';
    
    document.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        return false;
    });

    document.addEventListener('keydown', function(e) {
        if (e.ctrlKey && (e.keyCode === 85 || e.keyCode === 83 || e.keyCode === 73 || e.keyCode === 74)) {
            e.preventDefault();
            return false;
        }
        if (e.keyCode === 123) {
            e.preventDefault();
            return false;
        }
    });

    (function() {
        const devtools = /./;
        devtools.toString = function() {
            this.opened = true;
        };
        const checkDevTools = setInterval(function() {
            if (devtools.opened) {
                window.location.reload();
            }
            devtools.opened = false;
            console.log(devtools);
        }, 1000);
    })();

    const originalConsole = {
        log: console.log,
        warn: console.warn,
        error: console.error,
        info: console.info
    };

    console.log = function() {};
    console.warn = function() {};
    console.error = function() {};
    console.info = function() {};

    Object.defineProperty(document, 'body', {
        get: function() {
            return document.getElementsByTagName('body')[0];
        }
    });

    const script = document.createElement('script');
    script.textContent = `
        (function() {
            const meta = document.createElement('meta');
            meta.name = 'referrer';
            meta.content = 'no-referrer';
            document.head.appendChild(meta);
        })();
    `;
    document.head.appendChild(script);

    setInterval(function() {
        const before = new Date();
        debugger;
        const after = new Date();
        if (after - before > 100) {
            window.location.reload();
        }
    }, 1000);

})();
