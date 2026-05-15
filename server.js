'use strict';
// server.js — CRM 2G
// Hostinger/LiteSpeed comunica via Unix socket (caminho em process.env.HOSTNAME).
// Este servidor detecta automaticamente o modo: socket Unix ou TCP.

process.on('uncaughtException', function (err) {
  process.stderr.write('[CRASH] ' + (err.stack || err.message) + '\n');
  process.exit(1);
});
process.on('unhandledRejection', function (reason) {
  process.stderr.write('[CRASH] unhandledRejection: ' + String(reason) + '\n');
  process.exit(1);
});

var http = require('http');
var path = require('path');
var fs   = require('fs');
var url  = require('url');
var next = require('next');

var rawHostname = process.env.HOSTNAME || '';
var rawPort     = process.env.PORT     || '3000';
var port        = parseInt(rawPort, 10) || 3000;

// Hostinger define HOSTNAME como o caminho do socket Unix que o LiteSpeed espera.
// Ex: /usr/local/lsws/extapp-sock/crm2g.com:_.sock
var socketPath = rawHostname.startsWith('/') ? rawHostname : null;

process.stdout.write('[CRM2G] HOSTNAME=' + (rawHostname || '(vazio)') + '\n');
process.stdout.write('[CRM2G] PORT=' + rawPort + '\n');
process.stdout.write('[CRM2G] Modo: ' + (socketPath ? 'Unix socket → ' + socketPath : 'TCP 0.0.0.0:' + port) + '\n');

var app    = next({ dev: false, dir: __dirname });
var handle = app.getRequestHandler();

app.prepare()
  .then(function () {
    var server = http.createServer(function (req, res) {
      handle(req, res, url.parse(req.url, true));
    });

    server.on('error', function (err) {
      process.stderr.write('[SERVER ERROR] ' + err.message + '\n');
      process.exit(1);
    });

    if (socketPath) {
      // Remove socket anterior (evita EADDRINUSE entre restarts)
      try { fs.unlinkSync(socketPath); } catch (_) {}

      server.listen(socketPath, function () {
        // chmod 666 para que o LiteSpeed possa conectar
        try { fs.chmodSync(socketPath, '666'); } catch (_) {}
        process.stdout.write('[CRM2G] Ready em socket: ' + socketPath + '\n');
      });
    } else {
      server.listen(port, '0.0.0.0', function () {
        process.stdout.write('[CRM2G] Ready em http://0.0.0.0:' + port + '\n');
      });
    }
  })
  .catch(function (err) {
    process.stderr.write('[FATAL] app.prepare() falhou: ' + (err.stack || err.message) + '\n');
    process.exit(1);
  });
