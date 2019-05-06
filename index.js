const http = require('http');
const qs = require('querystring');
const ws = require('nodejs-websocket');

const bundleMap = new Map();

const server = http.createServer((request, response) => {
    response.setHeader("Access-Control-Allow-Origin", "*");
    response.setHeader("Access-Control-Allow-Headers", "*");
    response.setHeader("Access-Control-Allow-Methods", "PUT,POST,GET,DELETE,OPTIONS");
    response.setHeader("Content-Type", "*");
    if (request.method !== 'POST') {
        response.end();
        return;
    }

    let data = '';
    request.on('data', (chunk) => {
        data += chunk;
    });
    request.on('end', () => {
        const param = JSON.parse(data);
        const url = request.url;
        let result = null;
        switch (url) {
            case '/getBundle':
                result = getBundle(param.id);
                break;
            case '/sendBundle':
                result = setBundle(param);
        }
        response.end(JSON.stringify(result));
    })
});

const users = new Map();
ws.createServer((conn) => {
    console.log('conn');
    conn.on('text', (text) => {
        const param = JSON.parse(text);
        switch (param.event) {
            case 'log':
                console.log('login'), param.data;
                users.set(param.data, conn);
                break;
            case 'send':
                console.log(param.data);
                const targetConn = users.get(param.data.targetId);
                if (targetConn) {
                    targetConn.send(JSON.stringify({
                        event: 'msg',
                        data: {
                            senderId: param.data.senderId,
                            msg: param.data.msg,
                        },
                    }));
                } else {
                    conn.sendText(JSON.stringify({
                        event: 'error',
                        data: '对方未连接',
                    }));
                }
        }
    });

}).listen(2333);

function getBundle(id) {
    return {
        preKeyBundle: bundleMap.get(id),
    };
}

function setBundle(param) {
    bundleMap.set(param.id, param.bundle);
}

server.listen(3000, '0.0.0.0', () => {
    console.log('开启');
});

