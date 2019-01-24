/*****************************************************************************
*************************** DEPENDENCIES SECTION *****************************
******************************* (LIBS MODULES) *******************************
/*****************************************************************************/
var winston = require('winston');
var Utils = require('../util/Utils.js');
var _ = require('lodash');
var mesaDiretoraService = require('../services/MesaDiretoraService.js');

/*****************************************************************************
******************************* PRIVATE **************************************
/*****************************************************************************/
//...

/*****************************************************************************
******************************* PUBLIC ***************************************
*****************************************************************************/
//module methods
module.exports.getMesaDiretora = function(req, res, next) {
   var filter = {};

   if(req.query.sessaoAtual) {
      var sessaoAtual = parseInt(req.query.sessaoAtual)
      filter.sessaoAtual = sessaoAtual === 1;
   } else if (req.query.sessaoId) {
      filter.sessaoId = parseInt(req.query.sessaoId);
   } else if (req.query.legislaturaId) {
      filter.legislaturaId = parseInt(req.query.legislaturaId);
   }

   return mesaDiretoraService
      .getMesaDiretora(filter)
      .then(function(result) {
         Utils.sendJSONresponse(res, 200, result);
      }).catch(function(err){
         winston.error("Error while searching mesas diretoras", err);
         Utils.next(400, err, next);
      });
}
