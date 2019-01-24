/*****************************************************************************
*************************** DEPENDENCIES SECTION *****************************
******************************* (LIBS MODULES) *******************************
/*****************************************************************************/
var winston = require('winston');
var Utils = require('../util/Utils.js');
var _ = require('lodash');
var ordensDoDiaService = require('../services/OrdensDoDiaService.js');

/*****************************************************************************
******************************* PRIVATE **************************************
/*****************************************************************************/
//...

/*****************************************************************************
******************************* PUBLIC ***************************************
*****************************************************************************/
//module methods
module.exports.getOrdensDoDia = function(req, res, next) {
   var filter = {};
   //build the filter object based on request params
   if (req.query.ano) {
      filter.ano = parseInt(req.query.ano);
   }
   if (req.query.mes) {
      filter.mes = parseInt(req.query.mes);
   }
   if (req.query.dia) {
      filter.dia = parseInt(req.query.dia);
   }
   if (req.query.limit) {
      filter.limit = parseInt(req.query.limit);
   }
   if (req.query.offset) {
      filter.offset = parseInt(req.query.offset);
   }
   return ordensDoDiaService
      .getOrdensDoDia(filter)
      .then(function(result) {
         Utils.sendJSONresponse(res, 200, result);
      }).catch(function(err){
         winston.error("Error while searching ordens do dia", err);
         Utils.next(400, err, next);
      });
}

module.exports.getListaAnos = function(req, res, next) {
   return ordensDoDiaService
         .getListaAnos()
         .then(function(result) {
            Utils.sendJSONresponse(res, 200, result);
         }).catch(function(err){
            winston.error("Error while getting ordens do dia year list, err = [%s]", err);
            Utils.next(400, err, next);
         });
}
