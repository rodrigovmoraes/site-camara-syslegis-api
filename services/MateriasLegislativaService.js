/*****************************************************************************
*************************** DEPENDENCIES SECTION *****************************
******************************* (LIBS MODULES) *******************************
******************************************************************************/
var winston = require('winston');
var MySQLDatabase = require('../util/MySQLDatabase.js');

/*****************************************************************************
********************************** CONFIG ************************************
******************************************************************************/
//...
//..
//.

/*****************************************************************************
*********************************** PRIVATE ***********************************
******************************************************************************/
//...
//..
//.

/*****************************************************************************
**************************  Module functions *********************************
/*****************************************************************************/
module.exports.searchMateriasLegislativas = function(filter) {
   var syslegisDataBase = MySQLDatabase.newMySQLDatabase();
   var total = null;
   var materiasLegislativas = null;
   var queryMateriasLegislativasSelectPart = "SELECT documento.id, " +
                                             "       tipo_documento.descricao as tipoDocumento, "  +
                                             "       documento.numero, "  +
                                             "       documento.ano, "  +
                                             "       documento.data_publicacao, "  +
                                             "       documento.data_apresentacao, "  +
                                             "       documento.data_fim_prazo_executivo as data_prazo_executivo, "  +
                                             "       documento.data_processo as data_prazo_processo, "  +
                                             "       autor.descricao as autor, "  +
                                             "       documento.descricao as ementa, "  +
                                             "       status_tramitacao.descricao ultimaTramicao, " +
                                             "       IFNULL(documento.data_alteracao, documento.data_cadastro) as ultimaAtualizacao, " +
                                             "       documento.numero_lei as numLei, " +
                                             "       documento.id_tipo_lei as tipoLei ";
   var queryMateriasLegislativasTail       = "FROM   tipo_documento, "  +
                                             "       autor, " +
                                             "       documento "  +
                                             "LEFT JOIN status_tramitacao on documento.status_ultima_tramitacao_id = status_tramitacao.id " +
                                             "LEFT JOIN unidade_tramitacao on documento.local_ultima_tramitacao_id = unidade_tramitacao.id " +
                                             "WHERE documento.tipo_documento_id = tipo_documento.id " +
                                             "AND documento.autor_id = autor.id " +
                                             "AND documento.numero is not null " +
                                             "AND LOWER(documento.documento_publico) ='sim' " +
                                             "AND documento.numero != 99999 ";
   var queryMateriasLegislativasParams = [];
   //build the query based on filter
   //autor
   if (filter.autorId) {
     queryMateriasLegislativasTail += "AND ( autor.id = ? " +
                                      "      OR  ( ?  IN ( SELECT mla.autor_id " +
                                      "                    FROM materia_legislativa_autor mla " +
                                      "                    WHERE materia_legislativa_autores_id = documento.id ) ) ) ";
     queryMateriasLegislativasParams.push(filter.autorId);
     queryMateriasLegislativasParams.push(filter.autorId);
   }
   //tipo de materia
   if (filter.tipoMateriaId) {
     queryMateriasLegislativasTail += "AND tipo_documento.id = ? ";
     queryMateriasLegislativasParams.push(filter.tipoMateriaId);
   }
   //numero de materia
   if (filter.numeroMateria) {
     queryMateriasLegislativasTail += "AND documento.numero = ? ";
     queryMateriasLegislativasParams.push(filter.numeroMateria);
   }
   //ano materia
   if (filter.anoMateria) {
     queryMateriasLegislativasTail += "AND documento.ano = ? ";
     queryMateriasLegislativasParams.push(filter.anoMateria);
   }
   //estado em tramitacao ou não
   if (filter.emTramitacao || filter.emTramitacao === 0) {
        if (filter.emTramitacao === 0)  {
           //foi selecionada matérias que não estão em tramitação
           queryMateriasLegislativasTail += "AND documento.em_tramitacao = false ";
        } else if (filter.emTramitacao === 1) {
           //se foi selecionada matérias em tramitação
           queryMateriasLegislativasTail += "AND documento.em_tramitacao= true ";
        }
   }
   //palavras-chave
   if (filter.palavrasChave) {
      var palavrasChave = filter.palavrasChave.split(' ');

      for(var i = 0; i < palavrasChave.length; i++) {
         if (palavrasChave[i]) {
            queryMateriasLegislativasTail += "AND documento.palavras_chave LIKE CONCAT('%', ? , '%') ";
            queryMateriasLegislativasParams.push(palavrasChave[i]);
         }
      }
   }
   //data de apresentação
   if(filter.dataApresentacaoInicial && filter.dataApresentacaoFinal) {
      queryMateriasLegislativasTail += "AND documento.data_apresentacao BETWEEN ? AND ? ";
      queryMateriasLegislativasParams.push(new Date(filter.dataApresentacaoInicial));
      queryMateriasLegislativasParams.push(new Date(filter.dataApresentacaoFinal));
   } else if(filter.dataApresentacaoInicial) {
      queryMateriasLegislativasTail += "AND documento.data_apresentacao >= ? ";
      queryMateriasLegislativasParams.push(new Date(filter.dataApresentacaoInicial));
   } else if (filter.dataApresentacaoFinal) {
      queryMateriasLegislativasTail += "AND documento.data_apresentacao <= ? ";
      queryMateriasLegislativasParams.push(new Date(filter.dataApresentacaoFinal));
   }
   //data de publicacao
   if(filter.dataPublicacaoInicial && filter.dataPublicacaoFinal) {
      queryMateriasLegislativasTail += "AND documento.data_publicacao BETWEEN ? AND ? ";
      queryMateriasLegislativasParams.push(new Date(filter.dataPublicacaoInicial));
      queryMateriasLegislativasParams.push(new Date(filter.dataPublicacaoFinal));
   } else if (filter.dataPublicacaoInicial) {
      queryMateriasLegislativasTail += "AND documento.data_publicacao >= ? ";
      queryMateriasLegislativasParams.push(new Date(filter.dataPublicacaoInicial));
   } else if (filter.dataPublicacaoFinal) {
      queryMateriasLegislativasTail += "AND documento.data_publicacao <= ? ";
      queryMateriasLegislativasParams.push(new Date(filter.dataPublicacaoFinal));
   }
   //data prazo do executivo
   if(filter.dataPrazoExecutivoInicial && filter.dataPrazoExecutivoFinal) {
      queryMateriasLegislativasTail += "AND documento.data_fim_prazo_executivo BETWEEN ? AND ? ";
      queryMateriasLegislativasParams.push(new Date(filter.dataPrazoExecutivoInicial));
      queryMateriasLegislativasParams.push(new Date(filter.dataPrazoExecutivoFinal));
   } else if (filter.dataPrazoExecutivoInicial) {
      queryMateriasLegislativasTail += "AND documento.data_fim_prazo_executivo >= ? ";
      queryMateriasLegislativasParams.push(new Date(filter.dataPrazoExecutivoInicial));
   } else if (filter.dataPrazoExecutivoFinal) {
      queryMateriasLegislativasTail += "AND documento.data_fim_prazo_executivo <= ? ";
      queryMateriasLegislativasParams.push(new Date(filter.dataPrazoExecutivoFinal));
   }
   //data prazo fim do processo
   if(filter.dataPrazoProcessoInicial && filter.dataPrazoProcessoFinal) {
      queryMateriasLegislativasTail += "AND documento.data_processo BETWEEN ? AND ? ";
      queryMateriasLegislativasParams.push(new Date(filter.dataPrazoProcessoInicial));
      queryMateriasLegislativasParams.push(new Date(filter.dataPrazoProcessoFinal));
   } else if (filter.dataPrazoProcessoInicial) {
      queryMateriasLegislativasTail += "AND documento.data_processo >= ? ";
      queryMateriasLegislativasParams.push(new Date(filter.dataPrazoProcessoInicial));
   } else if (filter.dataPrazoProcessoFinal) {
      queryMateriasLegislativasTail += "AND documento.data_processo <= ? ";
      queryMateriasLegislativasParams.push(new Date(filter.dataPrazoProcessoFinal));
   }
   //localização atual
   if (filter.localizacaoId) {
      queryMateriasLegislativasTail += "AND documento.local_ultima_tramitacao_id = ? ";
      queryMateriasLegislativasParams.push(filter.localizacaoId);
   }
   //situação atual
   if (filter.statusTramitacaoId) {
      queryMateriasLegislativasTail += "AND documento.status_ultima_tramitacao_id = ? ";
      queryMateriasLegislativasParams.push(filter.statusTramitacaoId);
   }
   //classificacao
   if (filter.classificacaoId) {
      queryMateriasLegislativasTail += "AND ( ? IN ( SELECT classificacao_materia_id " +
                                       "             FROM materia_legislativa_classificacao_materia " +
                                       "             WHERE materia_legislativa_classificacoes_materia_id = documento.id ) ) ";
      queryMateriasLegislativasParams.push(filter.classificacaoId);
   }
   //lei
   if (filter.lei) {
      queryMateriasLegislativasTail += "AND documento.numero_lei IS NOT NULL ";
      queryMateriasLegislativasTail += "AND documento.id_tipo_lei IS NOT NULL ";
   }

   //query para contar o total de registros (sem paginação)
   var queryMateriasLegislativasCount = "SELECT COUNT(1) as total " + queryMateriasLegislativasTail;
   //adiciona o order by
   if (filter.tipoMateriaId) {
     queryMateriasLegislativasTail += "ORDER BY documento.ano DESC, documento.numero DESC, documento.data_apresentacao DESC ";
   } else {
     queryMateriasLegislativasTail += "ORDER BY documento.data_apresentacao DESC, documento.numero DESC, tipoDocumento DESC ";
   }

   return syslegisDataBase
      .openConnection()
      .then(function(connection) {
         return syslegisDataBase.query(queryMateriasLegislativasCount, queryMateriasLegislativasParams);
      }).then(function(rows) {
         //limit e offset
         total = rows[0].total;
         var limit = filter.limit ? filter.limit : 10;
         var offset = filter.offset ? Math.max(Math.min(filter.offset, total - 1), 0) : 0;
         if (filter.offset) {
            if(filter.offset > total - 1 && total > 0) {
               //get the last page if offset is out bound the rows
               //assume limit = pageSize
               var pageCount = Math.ceil(total / limit) ;
               offset = (pageCount - 1) * limit;
            } else {
               offset = filter.offset;
            }
         }
         queryMateriasLegislativasTail += "LIMIT ? OFFSET ? ";
         queryMateriasLegislativasParams.push(limit);
         queryMateriasLegislativasParams.push(offset);
         var queryMateriasLegislativas = queryMateriasLegislativasSelectPart + queryMateriasLegislativasTail;
         return syslegisDataBase.query(queryMateriasLegislativas, queryMateriasLegislativasParams);
      }).then(function(rows) {
         materiasLegislativas = rows;
         return syslegisDataBase.close();
      },
         //error in any previous then
         function (err) {
              //close the connection and rethrow the error
              //to an promise catch it
              return syslegisDataBase.close()
                                     .then(function() {
                                        throw err;
                                     });
         }
      ).then(function() {
         return {
            'total': total,
            'materiasLegislativas': materiasLegislativas
         };
      });
}

module.exports.getTiposDeMateria = function() {
   var query = "SELECT id, descricao " +
               "FROM tipo_documento t " +
               "WHERE materia = true " +
               "ORDER BY descricao;"
   var tiposDeMaterias = null;
   var syslegisDataBase = MySQLDatabase.newMySQLDatabase();
   return syslegisDataBase
      .openConnection()
      .then(function(connection) {
         return syslegisDataBase.query(query);
      }).then(function(rows) {
         tiposDeMaterias = rows;
         return syslegisDataBase.close();
      },
         //error in any previous then
         function (err) {
           //close the connection and rethrow the error
           //to an promise catch it
           return syslegisDataBase.close()
                                  .then(function() {
                                     throw err;
                                  });
         }
      ).then(function() {
         return {
            'tiposDeMateria': tiposDeMaterias
         }
      });
}

module.exports.getAutores = function() {
   var query = "SELECT id, descricao " +
               "FROM autor a " +
               "WHERE autor_de_materia = true " +
               "ORDER BY descricao;";
   var autores = null;
   var syslegisDataBase = MySQLDatabase.newMySQLDatabase();
   return syslegisDataBase
      .openConnection()
      .then(function(connection) {
         return syslegisDataBase.query(query);
      }).then(function(rows) {
         autores = rows;
         return syslegisDataBase.close();
      },
         //error in any previous then
         function (err) {
           //close the connection and rethrow the error
           //to an promise catch it
           return syslegisDataBase.close()
                                  .then(function() {
                                     throw err;
                                  });
         }
      ).then(function() {
         return {
            'autores': autores
         }
      });
}

module.exports.getUnidadesDeTramitacao = function() {
   var query = "SELECT id, descricao " +
               "FROM unidade_tramitacao " +
               "WHERE materia = true ORDER BY descricao;"
   var unidades = null;
   var syslegisDataBase = MySQLDatabase.newMySQLDatabase();
   return syslegisDataBase
      .openConnection()
      .then(function(connection) {
         return syslegisDataBase.query(query);
      }).then(function(rows) {
         unidades = rows;
         return syslegisDataBase.close();
      },
         //error in any previous then
         function (err) {
           //close the connection and rethrow the error
           //to an promise catch it
           return syslegisDataBase.close()
                                  .then(function() {
                                     throw err;
                                  });
         }
      ).then(function() {
         return {
            'unidades': unidades
         }
      });
}

module.exports.getListaDeStatusDeTramitacao = function() {
   var query = "SELECT id, descricao " +
               "FROM status_tramitacao " +
               "ORDER BY descricao;"
   var statusList = null;
   var syslegisDataBase = MySQLDatabase.newMySQLDatabase();
   return syslegisDataBase
      .openConnection()
      .then(function(connection) {
         return syslegisDataBase.query(query);
      }).then(function(rows) {
         statusList = rows;
         return syslegisDataBase.close();
      },
         //error in any previous then
         function (err) {
           //close the connection and rethrow the error
           //to an promise catch it
           return syslegisDataBase.close()
                                  .then(function() {
                                     throw err;
                                  });
         }
      ).then(function() {
         return {
            'listaDeStatus': statusList
         }
      });
}

module.exports.getClassificacoes = function() {
   var query = "SELECT id, descricao " +
               "FROM classificacao_materia " +
               "ORDER BY descricao;";
   var classificacoes = null;
   var syslegisDataBase = MySQLDatabase.newMySQLDatabase();
   return syslegisDataBase
      .openConnection()
      .then(function(connection) {
         return syslegisDataBase.query(query);
      }).then(function(rows) {
         classificacoes = rows;
         return syslegisDataBase.close();
      },
         //error in any previous then
         function (err) {
           //close the connection and rethrow the error
           //to an promise catch it
           return syslegisDataBase.close()
                                  .then(function() {
                                     throw err;
                                  });
         }
      ).then(function() {
         return {
            'classificacoes': classificacoes
         }
      });
}

module.exports.getMateriaLegislativa = function(idMateria) {
   //materia
   var queryMateria = "SELECT    documento.id, " +
                      "          tipo_documento.descricao as tipoDocumento, " +
                      "          documento.numero, " +
                      "          documento.ano, " +
                      "          autor.descricao as autor, " +
                      "          documento.descricao as ementa, " +
                      "          documento.texto_integral as textoIntegral, " +
                      "          documento.texto_integral_final as textoIntegralFinal, " +
                      "          SUBSTRING_INDEX(documento.texto_integral, '.', -1) as tipoDocumentoTextoIntegral, " +
                      "          SUBSTRING_INDEX(documento.texto_integral_final, '.', -1) as tipoDocumentoTextoIntegralFinal, " +
                      "          documento.data_apresentacao, " +
                      "          documento.data_fim_prazo_executivo as dataFimPrazoExecutivo, " +
                      "          documento.data_processo as dataFimPrazoProcesso, " +
                      "          documento.apensadas, " +
                      "          unidade_tramitacao.descricao as localizacaoAtual, " +
                      "          status_tramitacao.descricao as situacaoAtual, " +
                      "          documento.em_tramitacao as emTramitacao, " +
                      "          documento.numero_lei as numeroLei, " +
                      "          documento.id_tipo_lei as tipoLei " +
                      "FROM      tipo_documento, " +
                      "          autor, " +
                      "          documento " +
                      "LEFT JOIN status_tramitacao " +
                      "     ON   documento.status_ultima_tramitacao_id = status_tramitacao.id " +
                      "LEFT JOIN unidade_tramitacao " +
                      "     ON   documento.local_ultima_tramitacao_id = unidade_tramitacao.id " +
                      "WHERE     tipo_documento.id = documento.tipo_documento_id " +
                      "AND       autor.id = documento.autor_id " +
                      "AND       documento.numero IS NOT NULL " +
                      "AND       documento.id = ? " +
                      "AND       documento.documento_publico ='sim'";
   var queryMateriaParams = [];
   queryMateriaParams.push(idMateria);

   //classificacoes
   var queryClassificacoes = "SELECT   cm.descricao " +
                             "FROM     classificacao_materia cm, " +
                             "         materia_legislativa_classificacao_materia mcm " +
                             "WHERE    cm.id = mcm.classificacao_materia_id " +
                             "AND      mcm.materia_legislativa_classificacoes_materia_id = ? " +
                             "ORDER BY cm.descricao";
   var queryClassificacoesParams = [];
   queryClassificacoesParams.push(idMateria);

   //co-autores
   var queryCoAutores = "SELECT autor.descricao " +
                        "FROM   autor, " +
                        "       materia_legislativa_autor " +
                        "WHERE  autor.id = materia_legislativa_autor.autor_id " +
                        "AND    materia_legislativa_autor.materia_legislativa_autores_id = ? " +
                        "ORDER BY autor.descricao; ";
   var queryCoAutoresParams = [];
   queryCoAutoresParams.push(idMateria);

   //documento acessorios
   var queryDocumentosAcessorios = "SELECT documento.id, " +
                                   "	    documento.data_documento as data, " +
                                   "       documento.descricao as descricao, " +
                                   "       tipo_documento.descricao as tipoDocumento, " +
                                   "       SUBSTRING_INDEX(documento.texto_integral, '.', -1) as tipoDocumentoTextoIntegral, " +
                                   "       autor.descricao as autor, " +
                                   "       documento.texto_integral " +
                                   "FROM   documento, " +
                                   "       autor, " +
                                   "       tipo_documento " +
                                   "WHERE  tipo_documento.id = documento.tipo_documento_id " +
                                   "AND    autor.id = documento.autor_id " +
                                   "AND    validado = true " +
                                   "AND    documento.materia_legislativa_id = ? " +
                                   "ORDER BY documento.data_documento DESC;";
   var queryDocumentosAcessoriosParams = [];
   queryDocumentosAcessoriosParams.push(idMateria);

   //tramitacoes
   var queryTramitacoes = "SELECT    tramitacao.id as id_tramitacao, " +
                          "          tramitacao.data_tramitacao as dataTramitacao, " +
                          "          unidade_tramitacao.descricao as localizacao, " +
                          "          status_tramitacao.descricao as situacao, " +
                          "          tramitacao.texto_da_acao as textoDaAcao, " +
                          "          documento.id as documentoId, " +
                          "          documento.descricao as documentoDescricao " +
                          "FROM      tramitacao " +
                          "LEFT JOIN unidade_tramitacao " +
                          "       ON tramitacao.local_tramitacao_id = unidade_tramitacao.id " +
                          "LEFT JOIN status_tramitacao " +
                          "       ON tramitacao.status_tramitacao_id = status_tramitacao.id " +
                          "LEFT JOIN documento " +
                          "       ON tramitacao.id = documento.tramitacao_id " +
                          "WHERE     tramitacao.materia_legislativa_id = ? " +
                          "ORDER BY  tramitacao.ordem_da_tramitacao ASC, " +
                          "          tramitacao.data_tramitacao DESC, " +
                          "          tramitacao.cod_tramitacao DESC, " +
                          "          tramitacao.id DESC;";
   var queryTramitacoesParams = [];
   queryTramitacoesParams.push(idMateria);

   var syslegisDataBase = MySQLDatabase.newMySQLDatabase();
   var materia = null;
   var classificacoes = null;
   var coAutores = null;
   var documentoAcessorios = null;
   var tramitacoes = null;
   return syslegisDataBase
      .openConnection()
      .then(function(connection) {
         //query materia
         return syslegisDataBase.query(queryMateria, queryMateriaParams);
      }).then(function(materiaRows) {
         //materia result
         if(materiaRows && materiaRows.length > 0) {
            materia  = materiaRows[0];
         }
         //query classificacoes
         return syslegisDataBase.query(queryClassificacoes, queryClassificacoesParams);
      }).then(function(classificacoesRows) {
         //classificacoes result
         classificacoes = classificacoesRows;
         //query co-autores
         return syslegisDataBase.query(queryCoAutores, queryCoAutoresParams);
      }).then(function(coAutoresRows) {
         //co-autores result
         coAutores = coAutoresRows;
         //query documentos acessorios
         return syslegisDataBase.query(queryDocumentosAcessorios, queryDocumentosAcessoriosParams);
      }).then(function(documentosAcessoriosRows) {
         //documento acessorios result
         documentosAcessorios = documentosAcessoriosRows;
         //query tramitacoes
         return syslegisDataBase.query(queryTramitacoes, queryTramitacoesParams);
      }).then(function(tramitacoesRows) {
         tramitacoes = [];
         var i;
         var documentos = [];
         var tramitacao = null;
         var prevTramitacaoId = -1;

         if (tramitacoesRows) {
            for (i = 0; i < tramitacoesRows.length; i++) {
               if (prevTramitacaoId !== tramitacoesRows[i].id_tramitacao) { //new tramitacao object ?
                  if (tramitacao) {
                     //add the current tramitacao to the list
                     delete tramitacao.documentoId;
                     delete tramitacao.documentoDescricao;
                     tramitacao.tramitacaoDocumentos = documentos;
                     tramitacoes.push(tramitacao);
                  }
                  //tramitacao changed
                  //set new tramitacao object
                  tramitacao = tramitacoesRows[i];
                  documentos = [];
               }
               //add document to the list of the documents - current tramitacao
               if (tramitacoesRows[i].documentoId) {
                  documentos.push({
                     documentoTramitacaoId: tramitacoesRows[i].documentoId,
                     documentoTramitacaoDescricao: tramitacoesRows[i].documentoDescricao
                  });
               }
               //store the if of the previous tramitacao object
               prevTramitacaoId = tramitacoesRows[i].id_tramitacao;
            }
            //add the last tramitacao object if there are any
            if (tramitacao) {
               //add the current tramitacao to the list
               delete tramitacao.documentoId;
               delete tramitacao.documentoDescricao;
               tramitacao.tramitacaoDocumentos = documentos;
               tramitacoes.push(tramitacao);
            }
         }
         return syslegisDataBase.close();
      },
         //error in any previous then
         function (err) {
           //close the connection and rethrow the error
           //to an promise catch it
           return syslegisDataBase.close()
                                  .then(function() {
                                     throw err;
                                  });
      }).then(function() {
         return {
            'materia': materia,
            'classificacoes': classificacoes,
            'coAutores': coAutores,
            'documentosAcessorios': documentosAcessorios,
            'tramitacoes': tramitacoes
         }
      });
}
