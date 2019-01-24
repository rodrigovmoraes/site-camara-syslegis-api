/*****************************************************************************
*************************** DEPENDENCIES SECTION *****************************
******************************* (LIBS MODULES) *******************************
/*****************************************************************************/
var winston = require('winston');
var Utils = require('../util/Utils.js');
var _ = require('lodash');
var comissoesService = require('../services/ComissoesService.js');

/*****************************************************************************
******************************* PRIVATE **************************************
/*****************************************************************************/
//...

/*****************************************************************************
******************************* PUBLIC ***************************************
*****************************************************************************/
//module methods
module.exports.getComissoes = function(req, res, next) {
   var filter = {};

   if(req.query.sessaoAtual) {
      var sessaoAtual = parseInt(req.query.sessaoAtual)
      filter.sessaoAtual = sessaoAtual === 1;
   } else if (req.query.legislaturaId) {
      filter.legislaturaId = parseInt(req.query.legislaturaId);
   }

   return comissoesService
      .getComissoes(filter)
      .then(function(result) {
         Utils.sendJSONresponse(res, 200, result);
      }).catch(function(err){
         winston.error("Error while searching comissoes", err);
         Utils.next(400, err, next);
      });
}

module.exports.getLegislaturas = function(req, res, next) {
   return comissoesService
      .getLegislaturas()
      .then(function(result) {
         Utils.sendJSONresponse(res, 200, result);
      }).catch(function(err){
         winston.error("Error while getting legislaturas", err);
         Utils.next(400, err, next);
      });
}

module.exports.getSessoes = function(req, res, next) {
   var filter = {};

   if(req.query.legislaturaId) {
      filter.legislaturaId = parseInt(req.query.legislaturaId);;
   }
   return comissoesService
      .getSessoes(filter)
      .then(function(result) {
         Utils.sendJSONresponse(res, 200, result);
      }).catch(function(err){
         winston.error("Error while getting sessoes", err);
         Utils.next(400, err, next);
      });
}
