/*****************************************************************************
*************************** DEPENDENCIES SECTION *****************************
******************************* (LIBS MODULES) *******************************
/*****************************************************************************/
var winston = require('winston');
var Utils = require('../util/Utils.js');
var _ = require('lodash');
var vereadoresService = require('../services/VereadoresService.js');

/*****************************************************************************
******************************* PRIVATE **************************************
/*****************************************************************************/
//...

/*****************************************************************************
******************************* PUBLIC ***************************************
*****************************************************************************/
//module methods
module.exports.getVereadores = function(req, res, next) {
   var filter = {};

   if (req.query.legislaturaAtual) {
      var legislaturaAtual = parseInt(req.query.legislaturaAtual)
      filter.legislaturaAtual = legislaturaAtual === 1;
   } else if (req.query.legislaturaId) {
      filter.legislaturaId = parseInt(req.query.legislaturaId);
   }

   return vereadoresService
      .getVereadores(filter)
      .then(function(result) {
         Utils.sendJSONresponse(res, 200, result);
      }).catch(function(err){
         winston.error("Error while searching vereadores", err);
         Utils.next(400, err, next);
      });
}

module.exports.getVereador = function(req, res, next) {
   var vereadorId;
   if (req.params.id) {
      vereadorId = req.params.id;
      return vereadoresService
         .getVereador(vereadorId)
         .then(function(result) {
            Utils.sendJSONresponse(res, 200, result);
         }).catch(function(err){
            winston.error("Error while getting vereador", err);
            Utils.next(400, err, next);
         });
   } else {
      Utils.sendJSONresponse(res, 400, { message: 'undefined vereador id' });
   }
}

module.exports.getResumoMaterias = function(req, res, next) {
   var vereadorId;
   if (req.params.id) {
      vereadorId = req.params.id;
      return vereadoresService
         .getResumoMaterias(vereadorId)
         .then(function(result) {
            Utils.sendJSONresponse(res, 200, result);
         }).catch(function(err){
            winston.error("Error while getting resumo materias", err);
            Utils.next(400, err, next);
         });
   } else {
      Utils.sendJSONresponse(res, 400, { message: 'undefined vereador id' });
   }
}
