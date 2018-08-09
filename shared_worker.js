var port;
var ws = null;
var peers = [];

self.addEventListener('connect', function(e) {

    port = e.ports[0];
    peers.push(port);

    port.addEventListener('message', function(e) {

        // Start
        if (e.data.cmd === 'start') {

            var d = new Date();
            var n = d.getTime();

            if (ws === null) {
                // Socket init
                ws = new WebSocket(e.data.url);
                console.log("Create new socket: " + n);
            } else {
                console.log("Use old socket: " + n);
            }

            // On message receive
            ws.onmessage = function (msg) {
                if (typeof msg != 'undefined' && msg.data != 'undefined') {
                    send({'operation': 'on_message', 'data': JSON.parse(msg.data)});
                }
            };

            // On error connection
            ws.onerror = function () {
                ws = null;
                send({'operation': 'on_error'});
            };

            // On close connection
            ws.onclose = function (event) {
                ws = null;
                send({'operation': 'on_close', 'data': event.code});
            };

        // Send Message
        } else if (e.data.cmd === 'send') {
            if (ws !== null && ws.readyState === 1) {
                ws.send(e.data.data);
            }
        }

        // Отправляем данные клиенту
        function send (data) {
            console.log(peers);
            peers.forEach(function (port) {
                port.postMessage(data);
            });
        }
    }, false);

    port.start();
}, false);