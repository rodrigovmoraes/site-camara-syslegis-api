/*****************************************************************************
*************************** DEPENDENCIES SECTION *****************************
******************************* (LIBS MODULES) *******************************
/*****************************************************************************/
var winston = require('winston');
var Utils = require('../util/Utils.js');
var _ = require('lodash');
var materiasLegislativaService = require('../services/MateriasLegislativaService.js');

/*****************************************************************************
******************************* PRIVATE **************************************
/*****************************************************************************/
//...

/*****************************************************************************
******************************* PUBLIC ***************************************
*****************************************************************************/
//module methods
module.exports.pesquisaMateriasLegislativas = function(req, res, next) {
   if(req.body.filter) {
      var filter = req.body.filter ? req.body.filter : {};
      return materiasLegislativaService
         .searchMateriasLegislativas(filter)
         .then(function(result) {
            Utils.sendJSONresponse(res, 200, result);
         }).catch(function(err){
            winston.error("Error while searching materias legislativas, err = [%s]", err);
            Utils.next(400, err, next);
         });
   } else {
      Utils.sendJSONresponse(res, 400, { message: 'undefined filter' });
   }
}

module.exports.getMateriaLegislativa = function(req, res, next) {
   var filter = {};
   var filterOk = false;

   //find by id
   if (req.params.id) {
      filter.id = req.params.id;
      filterOk = true;
   //find by number and year
   } else if (req.query.numero && req.query.ano && req.query.tipo) {
      var filter = {};
      filter.numero = req.query.numero;
      filter.ano = req.query.ano;
      filter.tipo = req.query.tipo;
      filterOk = true;
   }

   if (filterOk) {
      return materiasLegislativaService
         .getMateriaLegislativa(filter)
         .then(function(result) {
            Utils.sendJSONresponse(res, 200, result);
         }).catch(function(err){
            winston.error("Error while getting materia legislativa, err = [%s]", err);
            Utils.next(400, err, next);
         });
   } else {
      Utils.sendJSONresponse(res, 400, { message: 'undefined materia id' });
   }
}

module.exports.getTiposDeMateria = function(req, res, next) {
   return materiasLegislativaService
         .getTiposDeMateria()
         .then(function(result) {
            Utils.sendJSONresponse(res, 200, result);
         }).catch(function(err){
            winston.error("Error while getting tipos de materias, err = [%s]", err);
            Utils.next(400, err, next);
         });
}

module.exports.getAutores = function(req, res, next) {
   return materiasLegislativaService
         .getAutores()
         .then(function(result) {
            Utils.sendJSONresponse(res, 200, result);
         }).catch(function(err){
            winston.error("Error while getting autores, err = [%s]", err);
            Utils.next(400, err, next);
         });
}

module.exports.getUnidadesDeTramitacao = function(req, res, next) {
   return materiasLegislativaService
         .getUnidadesDeTramitacao()
         .then(function(result) {
            Utils.sendJSONresponse(res, 200, result);
         }).catch(function(err){
            winston.error("Error while getting unidades de tramitacao, err = [%s]", err);
            Utils.next(400, err, next);
         });
}

module.exports.getListaDeStatusDeTramitacao = function(req, res, next) {
   return materiasLegislativaService
         .getListaDeStatusDeTramitacao()
         .then(function(result) {
            Utils.sendJSONresponse(res, 200, result);
         }).catch(function(err){
            winston.error("Error while getting lista status tramitacao, err = [%s]", err);
            Utils.next(400, err, next);
         });
}

module.exports.getClassificacoes = function(req, res, next) {
   return materiasLegislativaService
         .getClassificacoes()
         .then(function(result) {
            Utils.sendJSONresponse(res, 200, result);
         }).catch(function(err){
            winston.error("Error while getting classificacoes, err = [%s]", err);
            Utils.next(400, err, next);
         });
}
