var app = require('./app.js');
var debug = require('debug')('explorer-backend:server');
var http = require('http');

//apikey start
const apikeyInit = require('./apikey_gene/index')


var server, port;
var utility = {
  init: function () {
    port = utility.normalizePort(process.env.PORT || '50616');
    server = http.createServer(app.callback());
    server.listen(port);
    server.on('error', utility.onError);
    server.on('listening', utility.onListening);
    let apikeyGene_val = apikeyInit('email@example','canonChain')
    console.log('apikeyGene_val:'+apikeyGene_val)
  },
  onListening() {
    var addr = server.address();
    var bind = typeof addr === 'string'
      ? 'pipe ' + addr
      : 'port ' + addr.port;
    debug('Listening on ' + bind);
  },
  onError(error) {
    if (error.syscall !== 'listen') {
      throw error;
    }
    var bind = typeof port === 'string'
      ? 'Pipe ' + port
      : 'Port ' + port;

    // handle specific listen errors with friendly messages
    switch (error.code) {
      case 'EACCES':
        console.error(bind + ' requires elevated privileges');
        process.exit(1);
        break;
      case 'EADDRINUSE':
        console.error(bind + ' is already in use');
        process.exit(1);
        break;
      default:
        throw error;
    }
  },
  //将端口规范化为数字，字符串或false
  normalizePort(val) {
    var port = parseInt(val, 10);
    if (isNaN(port)) {
      // named pipe
      return val;
    }
    if (port >= 0) {
      // port number
      return port;
    }
    return false;
  },


};
utility.init();