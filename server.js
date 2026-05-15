'use strict';

process.on('uncaughtException', function(err) {
  process.stdout.write('[CRASH] ' + err.message + '\n' + (err.stack || '') + '\n');
  process.exit(1);
});
process.on('unhandledRejection', function(reason) {
  process.stdout.write('[CRASH] unhandledRejection: ' + String(reason) + '\n');
  process.exit(1);
});

// --- Diagnóstico de ambiente ---
var rawPort = process.env.PORT || '3000';
process.stdout.write('[ENV] PORT=' + rawPort + '\n');
process.stdout.write('[ENV] HOSTNAME=' + (process.env.HOSTNAME || '(não definido)') + '\n');
process.stdout.write('[ENV] NODE_ENV=' + (process.env.NODE_ENV || '(não definido)') + '\n');
process.stdout.write('[ENV] __dirname=' + __dirname + '\n');

var spawn = require('child_process').spawn;
var path  = require('path');
var fs    = require('fs');

var nextBin = path.join(__dirname, 'node_modules', '.bin', 'next');

// Verifica existência do binário next e do BUILD_ID
process.stdout.write('[CHECK] next bin: ' + (fs.existsSync(nextBin) ? 'OK' : 'NAO ENCONTRADO') + '\n');
process.stdout.write('[CHECK] .next/BUILD_ID: ' + (fs.existsSync(path.join(__dirname, '.next', 'BUILD_ID')) ? 'OK' : 'NAO ENCONTRADO') + '\n');

// Porta: se PORT for caminho de socket ou NaN, usa 3000
var port = parseInt(rawPort, 10);
if (isNaN(port) || port < 1) {
  process.stdout.write('[WARN] PORT invalido ("' + rawPort + '"), usando 3000\n');
  port = 3000;
}

// Hostname: NUNCA usa process.env.HOSTNAME (Hostinger define como caminho de socket Unix)
// Sempre escuta em 0.0.0.0 para todas as interfaces
var hostname = '0.0.0.0';

process.stdout.write('[STARTUP] Iniciando: next start -p ' + port + ' -H ' + hostname + '\n');

var child = spawn(nextBin, ['start', '-p', String(port), '-H', hostname], {
  cwd: __dirname,
  stdio: ['ignore', 'inherit', 'inherit'],
  env: process.env,
});

child.on('error', function(err) {
  process.stdout.write('[FATAL] Falha ao iniciar next: ' + err.message + '\n');
  process.exit(1);
});

child.on('exit', function(code, signal) {
  process.stdout.write('[EXIT] next terminou — code=' + code + ' signal=' + signal + '\n');
  process.exit(code != null ? code : 1);
});
