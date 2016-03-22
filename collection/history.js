var DBClient = require('./db');
var async = require("async");

// -----------------------------------------------------------------
function log(info) {
  console.log("-----------------------------------");
  var length = arguments.length;
  for (var i = 0; i < length; i++) {
    console.log(arguments[i]);
  }
}
// -----------------------------------------------------------------
var dbClient = new DBClient();

function HistoryDb() {
  this.dbClient = dbClient;
};

module.exports = HistoryDb;

// -----------------------------------------------------------------
/**
 * 存储工商信息中的页数allpageNum 和 企业条数 companyNum
 * @param  {json}   options  包含 allpageNum 和 companyNum
 * @param  {Function} callback 回调函数
 */
HistoryDb.prototype.saveListInfo = function(options, callback) {
    if (!options) {
      log("saveListInfo: options illegal", options);
      callback(null);
    } else {
      var self = this;

      self.dbClient.connect(function(err, db) {
        if (err) {
          log("saveListInfo: connect db error", err);
        } else {
          db.collection("ListsInfo", function(err, collection) {
            if (err) {
              db.close();
              log("saveListInfo: list info connect error", err);
              callback(err);
            } else {
              var allpageNum = 0;
              var companyNum = 0;
              if (options.hasOwnProperty("allpageNum")) {
                allpageNum = options.allpageNum || 0;
              }
              if (options.hasOwnProperty("companyNum")) {
                companyNum = options.companyNum;
              }
              collection.update({
                "lists": "lists"
              }, {
                $set: {
                  companyNum: companyNum,
                  allpageNum: allpageNum,
                  createTime: new Date()
                }
              }, {
                upsert: true
              }, function(err) {
                db.close();
                if (err) {
                  log("saveListInfo: update list into db error", err);
                  callback(err);
                } else {
                  log("saveListInfo: update list into db succeed");
                  callback(null);
                }
              })
            }
          })
        }
      });
    }
  }
  // -----------------------------------------------------------------
  /**
   * 获取当前状态下的 companyNum 和 allpageNum
   * @param  {Function} callback 回调函数
   */
HistoryDb.prototype.getListsNum = function(callback) {
  log("getListsNum: getListsNum called")
  var self = this;
  self.dbClient.connect(function(err, db) {
    if (err) {
      log("getListsNum: connect db error", err);
      callback(err, null);
    } else {
      log("getListsNum: then connect ListsInfo")
      db.collection("ListsInfo", function(err, collection) {
        if (err) {
          db.close();
          log("getListsNum: list info connect error", err);
          callback(err, null);
        } else {
          collection.findOne({
            'lists': 'lists'
          }, {
            fields: {
              companyNum: 1,
              allpageNum: 1
            }
          }, function(err, data) {
            db.close();
            if (err) {
              log("getListsNum: query lists from db error", err);
              callback(err, null);
            } else {
              log("getListsNum: query lists form db succeed");
              callback(null, data);
            }
          })
        }
      });
    }
  });
}

// -----------------------------------------------------------------
/**
 * 存数当前页所抓取的工商列表信息
 * @param  {json} options 当前企业信息列表
 */
HistoryDb.prototype.saveLists = function(options) {
  if (!options) {
    log("saveLists: options illegal", options);
  } else {
    var self = this;
    self.dbClient.connect(function(err, db) {
      if (err) {
        log("saveLists: connect db error", err);
      } else {
        db.collection("companyLists", function(err, collection) {
          if (err) {
            log("saveLists: connect to db collection error", err);
            callback(err);
          } else {
            async.each(options, function(option, done) {
              option.handled = false;
              option.createTime = new Date();
              collection.update({
                companyName: option.companyName
              }, {
                $set: option
              }, {
                upsert: true
              }, function(err) {
                if (err) {
                  log("saveLists: save list " + option.companyName + " into companyLists error", err);
                  done(err);
                } else {
                  log("saveLists: save list " + option.companyName + " into companyLists succeed");
                  done();
                }
              })
            }, function(err) {
              db.close();
              if (err) {
                log("saveLists: save lists error", err);
              } else {
                log("saveLists: save lists succeed");
              }
            })
          }
        })
      }
    });
  }
}


// -----------------------------------------------------------------
/**
 * 获取当前所有已经通过企业名称，状态
 * @param  {function} callback company lists
 */
HistoryDb.prototype.getAllLists = function(callback) {
  log("getAllLists: getAllLists called")
  var self = this;
  self.dbClient.connect(function(err, db) {
    if (err) {
      log("getAllLists: connect db error", err);
      callback(err, null);
    } else {
      log("getAllLists: then connect companyLists")
      db.collection("companyLists", function(err, collection) {
        if (err) {
          db.close();
          log("getAllLists: connect companyLists db error", err);
          callback(err, null);
        } else {
          collection.find({
            "applyStatus": /核准|可领照/,
            handled: false
          }).project({
            _id: 0,
            companyName: 1,
            applyStatus: 1
          }).toArray(function(err, results) {
            db.close();
            if (err) {
              log("getAllLists: find all lists info error", err);
              callback(err, null);
            } else {
              log("getAllLists: find all lists info succeed");
              callback(null, results);
            }
          })
        }
      });
    }
  });
}

// -----------------------------------------------------------------
/**
 * 存储当前公司名称所在页面所有公司的信息
 * @param  {json} options 当前公司的简明信息
 */
HistoryDb.prototype.saveCompanyBasic = function(options) {
  log("saveCompanyBasic: this function called");
  if (!options) {
    log("saveCompanyBasic: options illegal", options);
  } else {
    var self = this;
    self.dbClient.connect(function(err, db) {
      if (err) {
        log("saveCompanyBasic: connect db error", err);
      } else {
        db.collection("company", function(err, collection) {
          if (err) {
            db.close();
            log("saveCompanyBasic: connect to db collection error", err);
          } else {
            // 当前获取到的企业信息全部存入数据库
            // 存取多条的原因是可能同样的名字有多条记录存在
            async.each(options, function(option, done) {
              option.createTime = new Date();
              option.handledDetail = false;
              collection.update({
                companyName: option.companyName
              }, {
                $set: option
              }, {
                upsert: true
              }, function(err) {
                if (err) {
                  log("saveCompanyBasic: save company " + option.companyName + " into company collection error", err);
                  done(err);
                } else {
                  log("saveCompanyBasic: save company " + option.companyName + " into company collection succeed");
                  done();
                }
              })
            }, function(err) {
              db.close();
              if (err) {
                log("saveCompanyBasic: save company error", err);
              } else {
                log("saveCompanyBasic: save company succeed");
                // 当前应经存入数据库的公司打上已经处理的标记
                self._companyHandled(options);
              }
            })
          }
        })
      }
    })
  }
}

// -----------------------------------------------------------------
/**
 * 标记已经查询并存储的公司名称
 * @param  {json} options company lists
 */
HistoryDb.prototype._companyHandled = function(options) {
    log("companyHandled: this function called");
    if (!options) {
      log("companyHandled: options illegal", options);
    } else {
      var self = this;
      self.dbClient.connect(function(err, db) {
        if (err) {
          log("companyHandled: connect db error", err);
        } else {
          db.collection("companyLists", function(err, collection) {
            if (err) {
              db.close();
              log("companyHandled: connect to db collection error", err);
            } else {
              // 当前获取到的企业信息可能有多条存在
              // 存取多条的原因是可能同样的名字有多条记录存在
              async.each(options, function(option, done) {
                collection.update({
                  companyName: option.companyName
                }, {
                  $set: {
                    handled: true,
                    handledTime: new Date()
                  }
                }, function(err) {
                  if (err) {
                    log("companyHandled: update company " + option.companyName + " handled error", err);
                    done(err);
                  } else {
                    log("companyHandled: update company " + option.companyName + " handled  succeed");
                    done();
                  }
                })
              }, function(err) {
                db.close();
                if (err) {
                  log("companyHandled: update company error", err);
                } else {
                  log("companyHandled: update company succeed");

                }
              })
            }
          })
        }
      })
    }
  }
  // -----------------------------------------------------------------
  /**
   * 获取当前未取得详细信息企业的名称列表
   * @param  {Function} callback 返回 companyName, companyQueryId
   */
HistoryDb.prototype.getAllCompanyLists = function(callback) {
  log("getAllCompanyLists: getAllCompanyLists called")
  var self = this;
  self.dbClient.connect(function(err, db) {
    if (err) {
      log("getAllCompanyLists: connect db error", err);
      callback(err, null);
    } else {
      log("getAllCompanyLists: then connect collection company")
      db.collection("company", function(err, collection) {
        if (err) {
          db.close();
          log("getAllCompanyLists: connect collection company error", err);
          callback(err, null);
        } else {
          collection.find({
            handledDetail: false
          }).project({
            _id: 0,
            companyName: 1,
            companyQueryId: 1
          }).toArray(function(err, results) {
            db.close();
            if (err) {
              log("getAllCompanyLists: find all company info error", err);
              callback(err, null);
            } else {
              log("getAllCompanyLists: find all company info succeed");
              callback(null, results);
            }
          })
        }
      });
    }
  });
}


// -----------------------------------------------------------------
/**
 * 存储企业基本信息
 * @param  {json}   options  包含
 * companyQueryId: 企业基本信息查询id
 * companyId: 企业注册号
 * basicDetail: 企业基本信息
 * checkDetail: 年检信息简明列表
 */
HistoryDb.prototype.saveBasicDetail = function(options) {
  log("saveBasicDetail: saveBasicDetail called")
  if (!options || !options.hasOwnProperty("companyQueryId") || !options.hasOwnProperty("basicDetail")) {
    log("saveBasicDetail: options illegal", options);
  } else {
    var self = this;
    self.dbClient.connect(function(err, db) {
      if (err) {
        log("saveBasicDetail: connect db error", err);
      } else {
        log("saveBasicDetail: then connect collection company")
        db.collection("company", function(err, collection) {
          if (err) {
            db.close();
            log("saveBasicDetail: connect collection company error", err);
          } else {
            collection.update({
              companyQueryId: options.companyQueryId
            }, {
              $set: {
                companyId: options.companyId,
                basicDetail: options.basicDetail,
                checkDetail: options.checkDetail,
                handledDetail: true,
                handledTime: new Date()
              }
            }, function(err) {
              db.close();
              if (err) {
                log("saveBasicDetail: save basic detail to collection company error", err);
              } else {
                log("saveBasicDetail: save basic detail to collection company succeed");
              }
            })
          }
        })
      }
    })
  }
}

// -----------------------------------------------------------------
/**
 * 存储当前公司字号基本信息和详细信息
 * @param  {json} options company information
 */
HistoryDb.prototype.saveBasicAll = function(options) {
  log("saveBasicAll: saveBasicAll called")
  if (!options || !options.hasOwnProperty("companyQueryId") || !options.hasOwnProperty("basicDetail") || !options.hasOwnProperty("companyName")) {
    log("saveBasicAll: options illegal", options);
  } else {
    var self = this;
    self.dbClient.connect(function(err, db) {
      if (err) {
        log("saveBasicAll: connect db error", err);
      } else {
        log("saveBasicAll: then connect collection company")
        db.collection("company", function(err, collection) {
          if (err) {
            db.close();
            log("saveBasicAll: connect collection company error", err);
          } else {
            options.createTime = new Date();
            options.handledDetail = true;
            options.handledTime = new Date();
            var companyName = options.companyName;
            // 更新当前公司的信息
            collection.update({
              companyQueryId: options.companyQueryId
            }, {
              $set: options
            }, {
              upsert: true
            }, function(err) {
              db.close();
              if (err) {
                log("saveBasicAll: save basic all " + companyName + " error", err);
              } else {
                log("saveBasicAll: save basic all " + companyName + " succeed");
                // 标记已经查询并存储的公司名称
                self._companyHandled([{
                  companyName: companyName
                }]);
              }
            })

          }
        })
      }
    })
  }
}

// -----------------------------------------------------------------

HistoryDb.prototype.saveTest = function(options, callback) {
    if (!options) {
      log("saveTest: options illegal", options);
      callback(null);
    } else {
      var self = this;

      self.dbClient.connect(function(err, db) {
        if (err) {
          log("saveTest: connect db error", err);
        } else {
          db.collection("ListsTest", function(err, collection) {
            if (err) {
              db.close();
              log("saveTest: list info connect error", err);
              callback(err);
            } else {
              collection.update({
                industryType: options.industryType
              }, {
                $set: options
              }, {
                upsert: true
              }, function(err) {
                db.close();
                if (err) {
                  log("saveTest: update list into db error", err);
                  callback(err);
                } else {
                  log("saveTest: update list into db succeed");
                  callback(null);
                }
              })
            }
          })
        }
      });
    }
  }

