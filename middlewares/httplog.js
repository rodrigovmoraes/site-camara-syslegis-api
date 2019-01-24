/*****************************************************************************
*************************** DEPENDENCIES SECTION *****************************
******************************* (LIBS MODULES) *******************************
/*****************************************************************************/
var winston = require('winston');
var _ = require('lodash');

module.exports = function(req, res, next) {
   var now = new Date();
   var nowStr = _.padStart(now.getFullYear().toString(), 4, '0') + "-" +
                _.padStart(now.getMonth().toString(), 2, '0') + "-" +
                _.padStart(now.getDate().toString(), 2, '0') + " " +
                _.padStart(now.getHours().toString(), 2, '0') + ":" +
                _.padStart(now.getMinutes().toString(), 2, '0') + ":" +
                _.padStart(now.getSeconds().toString(), 2, '0');
   winston.verbose("%s %s REQUEST FROM %s %s [%s]", nowStr, req.protocol.toUpperCase(), req.socket.address().address, req.method, req.originalUrl);
   next();
}
