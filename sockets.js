(function($) {
    var GetDataForUser = {

        // Конфиги
        settings: {
            host: 'ws://curex.ll:8880',
            delay_request: 3000,
            user_id: '',
            shared_worker: 'shared_worker.js',
            shared_worker_version: '1.0.7'
        },

        // Инициализация модуля
        init: function(options) {
            $.extend(GetDataForUser.settings, options);

            // Инитим webSocket
            GetDataForUser.webSocketInit();
        },

        // Инициализация работы с webSocket
        webSocketInit: function() {
            try {
                web_worker = new SharedWorker(
                    GetDataForUser.settings.shared_worker + "?version=" + GetDataForUser.settings.shared_worker_version
                );

                web_worker.port.addEventListener("message", function(e) {

                    // On message receive
                    if (e.data.operation === 'on_message') {
                        if (e.data.data != 'undefined') {
                            var data = e.data.data;

                            if (typeof data != 'undefined' && data.status == 'success' && data.data) {
                                GetDataForUser.fireEvents(data.data);
                            }
                        }

                    // On error connection
                    } else if (e.data.operation === 'on_error') {
                        // logger.alert('js_error', {full_message: 'SocketOnError'});

                    // On close connection, trying to reconnect in 3 sec
                    } else if (e.data.operation === 'on_close') {
                        setTimeout(function () {
                            // Start command Shared Worker
                            web_worker.port.postMessage({'cmd': 'start', 'url': GetDataForUser.settings.host});

                            // logger.debug('SocketOnClose ' + e.data.data);
                        }, GetDataForUser.settings.delay_request);
                    }
                }, false);

                // Shared Worker On Error
                web_worker.onerror = function(err){
                    // logger.alert('js_error', {full_message: 'WebWorkerError ' + err.message});
                    web_worker.port.close();
                };

                // Init SharedWorker
                web_worker.port.start();

                // Start command Shared Worker
                web_worker.port.postMessage({'cmd': 'start', 'url': GetDataForUser.settings.host});

                // Запускаем процесс получения данных кассира
                GetDataForUser.getData();

            } catch (e) {
                window.onerror(e);
            }
        },

        // Получение данных для пользователя
        getData: function() {
            function getData(user_id) {

                // Если вкладка не активная, не делаем на нее запросы
                if (document.hidden || document.msHidden || document.webkitHidden || document.mozHidden) {
                    timerId = setTimeout(function () {
                        getData(user_id);
                    }, GetDataForUser.settings.delay_request);

                } else {
                    timerId = setTimeout(function () {
                        web_worker.port.postMessage({
                            'cmd': 'send',
                            'data': JSON.stringify({user_id: user_id})
                        });

                        getData(user_id);

                    }, GetDataForUser.settings.delay_request);
                }
            }

            var timerId = getData(GetDataForUser.settings.user_id);
        },

        // Файрим события
        fireEvents: function (data) {
            $('[name=data]').html(JSON.stringify(data));
        }
    };

    window.GetDataForUser = {init: GetDataForUser.init};
}($));

// Инитим объект и запускаем опрос
$(document).ready(function () {
    // Модуль получения данных для кассира
    GetDataForUser.init({user_id: '12313241'});
});