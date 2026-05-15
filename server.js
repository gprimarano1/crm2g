'use strict';
// server.js — CRM 2G
// Carrega o Next.js CLI directamente (sem fork/spawn) para mínimo uso de memória.
// Compatível com Hostinger Node.js + OpenLiteSpeed.

process.on('uncaughtException', function (err) {
  process.stderr.write('[CRASH] ' + (err.stack || err.message) + '\n');
  process.exit(1);
});
process.on('unhandledRejection', function (reason) {
  process.stderr.write('[CRASH] unhandledRejection: ' + String(reason) + '\n');
  process.exit(1);
});

var path = require('path');
var port = parseInt(process.env.PORT, 10) || 3000;

// Simula os args de CLI: next start -p PORT -H 0.0.0.0
// HOSTNAME env é ignorado propositadamente (Hostinger define-o como caminho de socket)
process.argv = [process.argv[0], 'next', 'start', '-p', String(port), '-H', '0.0.0.0'];

// Carrega o binário Next.js directamente — sem processo filho
require(path.join(__dirname, 'node_modules', 'next', 'dist', 'bin', 'next'));
