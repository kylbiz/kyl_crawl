// 连接数据库
var dbsettings = require('../settings.js').db;
var url = "mongodb://precious:mongodb_kyl_biz_precious@localhost:27017/precious"
Db = require("mongodb").Db;
Server = require("mongodb").Server;
MongoClient = require("mongodb").MongoClient;

function DBClient() {

}

module.exports = DBClient;



DBClient.prototype.connect = function DBClient(callback) {
  new MongoClient.connect(url, {
    uri_decode_auth: false,
    db: new Db(dbsettings.db,  new Server(dbsettings.host, dbsettings.port, {
        poolSize: dbsettings.poolSize
      }))
    }, function(err, db) {
    if (err) {
      console.log("connect db %s error", dbsettings.db);
      console.log(err);
    } else {
      console.log("connect db %s succeed", dbsettings.db);
      callback(null, db);
    }
  })
}


DBClient.prototype.close = function() {
  this.connect(function(err, db) {
    if(db) {
      db.close();
    }
  })
}

