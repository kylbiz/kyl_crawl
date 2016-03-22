var DBClient = require('./db');
var async = require("async");
var SETTINGS = require("../settings");
var REG_SETTINGS = SETTINGS.registration;


//-------------------------------------------------

var fileflag = false;

function log(info) {
  console.log("-----------------------------------");
  var length = arguments.length;
  for (var i = 0; i < length; i++) {
    if (fileflag) {
      console.log("registration: ", arguments[i]);
    } else {
      console.log(arguments[i]);
    }
  }
}
//-------------------------------------------------

function RegDB() {
  this.dbClient = new DBClient();
};

module.exports = RegDB;
//-------------------------------------------------
/**
 * 存储公司基本信息到Registration 
 * @param  {json}   options  包含outputs 和 db
 * @param  {function} callback 
 */
RegDB.prototype._SaveReg = function(options, callback) {
    var outputs = options.outputs;
    var self = this;
    self.dbClient.connect(function(err, db) {
      if (err) {
        log("_SaveReg: connect db error", err);
      } else {
        db.collection("Registration", function(err, collection) {
          if (err) {
            log("_SaveReg: registration connect error", err);
            callback(err, null);
          } else {
            async.each(outputs, function(output, done) {
              var company = output.company;
              var companyName = company.companyName;
              log("_SaveReg: save companyName: " + companyName)
              collection.update({
                "companyName": companyName
              }, {
                $set: {
                  companyName: companyName,
                  companyId: company.companyId || "",
                  companyQueryId: company.companyQueryId,
                  companyStatus: company.companyStatus,
                  companyAddress: company.address,
                  basicDetail: output.basicDetail,
                  annualCheckDetail: output.annualCheckDetail,
                  createTime: new Date(),
                  server: 'KYLYIQICHA'
                }
              }, {
                upsert: true
              }, function(err) {
                if (err) {
                  log("_SaveReg: update registration basic information error", err);
                  done(err);
                } else {
                  log("_SaveReg: update registration basic information succeed");
                  done();
                }
              })
            }, function(err) {
              db.close();
              if (err) {
                log("_SaveReg: update registrations error", err);
                callback(err, null);
              } else {
                log("_SaveReg: update registrations succeed");
                callback(null, null)
              }
            })
          }
        });
      }
    })
  }
  //-------------------------------------------------
  /**
   * 存储公司基本信息到Credit
   * @param  {json}   options  包含outputs 和 db
   * @param  {function} callback 
   */
RegDB.prototype._SaveRegCredit = function(options, callback) {
  var self = this;
  var outputs = options.outputs;
  self.dbClient.connect(function(err, db) {
    if (err) {
      log("_SaveRegCredit: connect db error", err);
    } else {
      db.collection("Credit", function(err, collection) {
        if (err) {
          log("_SaveRegCredit: redit connect error", err);
          // // db.close();
          callback(err, null);
        } else {
          async.each(outputs, function(output) {
            var company = output.company;
            var companyName = company.companyName;
            log("_SaveRegCredit: save companyName: " + companyName)
            collection.update({
              "companyName": companyName
            }, {
              $set: {
                companyName: companyName,
                companyId: company.companyId || "",
                companyQueryId: company.companyQueryId,
                companyStatus: company.companyStatus,
                companyAddress: company.address,
                basicDetail: output.basicDetail,
                annualCheckDetail: output.annualCheckDetail,
                createTime: new Date(),
                server: 'KYLYIQICHA'
              }
            }, {
              upsert: true
            }, function(err) {
              // // db.close();
              if (err) {
                log("_SaveRegCredit: update credit basic information error", err);
                done(err);
              } else {
                log("_SaveRegCredit: update credit basic information succeed");
                done();
              }
            })
          }, function(err) {
            db.close();
            if (err) {
              log("_SaveRegCredit: update credit basic error", err);
            } else {
              log("_SaveRegCredit: update credit basic succeed");
            }
          })
        }
      });
    }
  })
}

//-------------------------------------------------
/**
 * 存储 字段基本信息，会同时存入 Registration, Credit 两个collection
 * @param  {json} options 
 * 必须包含numberOfResults, allpageNo, detailResultsOutputs
 */
RegDB.prototype.saveBasic = function(options) {
    log("saveBasic called")
    var self = this;
    var numberOfResults = options.numberOfResults;
    var allpageNo = options.allpageNo;
    var outputs = options.detailResultsOutputs;

    if (numberOfResults > 0) {
      var regoptions = {
          outputs: outputs
        }
        // update credit information

      self._SaveReg(regoptions, function(err, result) {
        if (err) {
          log("saveBasic: save registration error", err);
        } else {
          log("saveBasic: save registration succeed");
        }
      });

      process.nextTick(function() {
        self._SaveRegCredit(regoptions, function(err, result) {
          if (err) {
            log("saveBasic: save credit error", err);
          } else {
            log("saveBasic: save credit succeed");
          }
        });
      })

    }
  }
  //-------------------------------------------------
  /**
   * 存储企业信用信息
   * @param  {options} options 必须包含companId, companyName
   * result 是抓取到得信息
   */
RegDB.prototype.saveCredit = function(options) {
  var companyId = options.companyId;
  var companyName = options.companyName;
  var result = options.result || {};
  result.companyId = companyId;
  var self = this;
  self.dbClient.connect(function(err, db) {
    if (err) {
      log("saveCredit: connect mongodb error", err);
    } else {
      db.collection("Credit", function(err, collection) {
        if (err) {
          log("saveCredit: credit connect error", err);
          // db.close();
        } else {
          collection.update({
            companyName: companyName
          }, {
            $set: result
          }, {
            upsert: true
          }, function(err) {
            db.close();
            if (err) {
              log("saveCredit: save credit information error", err);
            } else {
              log("saveCredit: save credit information succeed");
            }
          })
        }
      });
    }
  })
}

//-------------------------------------------------
/**
 * 初始化 CompanySearchRecords 表
 * @param {json} options 必须提供 keywords 和 uuid
 */
RegDB.prototype.InitRecord = function(options) {
  var keywords = options.keywords;
  var uuid = options.uuid;
  var self = this;
  self.dbClient.connect(function(err, db) {
    if (err) {
      log("InitRecord: open mongodb error", err);
    } else {
      db.collection("CompanySearchRecords", function(err, collection) {
        if (err) {
          log("InitRecord: connect search records collection error", err);
          // db.close();
        } else {
          var insertoptions = {
            keywords: keywords,
            createTime: new Date(),
            numberOfResults: 0,
            allpageNo: 0,
            readyflag: false,
            handledflag: true,
            uuid: uuid,
            server: 'KYLYIQICHA'
          }
          collection.insert(insertoptions, function(err) {
            db.close();
            if (err) {
              log("InitRecord: insert keywords " + keywords + " to companySearchRecords error ", err);
            } else {
              log('InitRecord: insert keywords ' + keywords + ' to companySearchRecords succeed');
            }
          })
        }
      });
    }
  });
}

//-------------------------------------------------
/**
 * 更新CompaySearchRecords表，以表示查询结果
 * @param {json} options 需提供查询结果的numberOfResults 和 allpageNo
 */
RegDB.prototype.UpdateRecords = function(options) {
  log(options)
  var numberOfResults = options.numberOfResults;
  var allpageNo = options.allpageNo;
  var keywords = options.keywords;
  var uuid = options.uuid;
  var readyflag = true;
  var self = this;
  self.dbClient.connect(function(err, db) {
    if (err) {
      log("updateRecords: open mongodb error", err);
    } else {
      db.collection("CompanySearchRecords", function(err, collection) {
        if (err) {
          log("updateRecords: connect search records collection error", err);
          // db.close();
        } else {
          collection.update({
            keywords: keywords,
            uuid: uuid
          }, {
            $set: {
              numberOfResults: numberOfResults,
              allpageNo: allpageNo,
              readyflag: true
            }
          }, {
            upsert: true
          }, function(err) {
            // db.close();
            if (err) {
              log('updateRecords: Update keywords ' + keywords + ' to companySearchRecords error', err);
            } else {
              log('updateRecords: Update keywords ' + keywords + ' to companySearchRecords succeed');
            }
          })
        }
      })
    }
  });
}

//-------------------------------------------------
/**
 * 存储更多字号信息
 * @param  {json} options contains detailResultsOutputs
 */
RegDB.prototype.saveMoreRegistration = function(options) {
  var self = this;
  if (!options.hasOwnProperty("detailResultsOutputs")) {
    log("saveMoreRegistration failed", options)
  } else {
    var outputs = options.detailResultsOutputs;
    self.dbClient.connect(function(err, db) {
      if (err) {
        log("saveMoreRegistration: open mongodb error", err);
        // db.close();
      } else {
        var regoptions = {
            outputs: outputs,
            db: db
          }
          // update credit information
        self._SaveRegCredit(regoptions, function(err, result) {
          if (err) {
            // db.close();
            log("saveMoreRegistration: save credit error", err);
          } else {
            log("saveMoreRegistration: save credit succeed");
          }
        });
      }
    })
  }
}

//-------------------------------------------------

RegDB.prototype.updateTimes = function() {
  var self = this;
  self.dbClient.connect(function(err, db) {
    if (err) {
      log("updateTimes: open mongodb error", err);
    } else {
      db.collection("CompanySearchTimes", function(err, collection) {
        if (err) {
          log("updateTimes: connect search times collection error", err);
          // db.close();
        } else {
          collection.update({
            "keywords": "registration"
          }, {
            $inc: {
              times: 1
            }
          }, {
            upsert: true
          }, function(err) {
            // db.close();
            if (err) {
              log("updateTimes: inscrising search times +1 error");
            } else {
              log("updateTimes: inscresed search times +1 succeed.");
            }
          })
        }
      })
    }
  })
}

//-------------------------------------------------