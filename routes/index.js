/*****************************************************************************
*************************** DEPENDENCIES SECTION *****************************
******************************* (LIBS MODULES) *******************************
/*****************************************************************************/
var express = require('express');
var router = express.Router();

/*****************************************************************************
*************************** DEPENDENCIES SECTION *****************************
******************************* (APP MODULES) ********************************
/*****************************************************************************/

/*****************************************************************************
********************* REQUIRE CONTROLLERS MODULES ****************************
/*****************************************************************************/
var materiasLegislativas = require('../controllers/materiasLegislativas.js');
var ordensDoDia = require('../controllers/ordensDoDia.js');
var comissoes = require('../controllers/comissoes.js');
var mesaDiretora = require('../controllers/mesaDiretora.js');
var comissoes = require('../controllers/comissoes.js');
var vereadores = require('../controllers/vereadores.js');

/*****************************************************************************
***************************** CONTROLLERS CONFIG *****************************
/*****************************************************************************/
//section reserved for controllers configuration, some controllers
//require special configuration which are executed here
//...
//..
//.

/*****************************************************************************
***************************** ROUTER DEFINITIONS *****************************
/*****************************************************************************/
router.post('/materiasLegislativas', materiasLegislativas.pesquisaMateriasLegislativas);
router.get('/tiposDeMateria', materiasLegislativas.getTiposDeMateria);
router.get('/autores', materiasLegislativas.getAutores);
router.get('/unidadesDeTramitacao', materiasLegislativas.getUnidadesDeTramitacao);
router.get('/listaDeStatusDeTramitacao', materiasLegislativas.getListaDeStatusDeTramitacao);
router.get('/classificacoes', materiasLegislativas.getClassificacoes);
router.get('/materiaLegislativa/:id', materiasLegislativas.getMateriaLegislativa);
router.get('/ordensDoDia/anos', ordensDoDia.getListaAnos);
router.get('/ordensDoDia', ordensDoDia.getOrdensDoDia);
router.get('/comissoes', comissoes.getComissoes);
router.get('/legislaturas', comissoes.getLegislaturas);
router.get('/sessoesLegislativas', comissoes.getSessoes);
router.get('/mesaDiretora', mesaDiretora.getMesaDiretora);
router.get('/vereadores', vereadores.getVereadores);
router.get('/vereador/resumoMaterias/:id', vereadores.getResumoMaterias);
router.get('/vereador/:id', vereadores.getVereador);

module.exports = router;
