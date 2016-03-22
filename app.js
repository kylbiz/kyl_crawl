var restify = require("restify");
var serversettings = require("./settings").server;
var RegistrationServer = require("./lib/registration");
require('events').EventEmitter.prototype._maxListeners = 100
var RegServer = new RegistrationServer();

var HistoryLists = require("./lib/historyLists");
var historyLists = new HistoryLists();




//-------------------------------------------------
var server = restify.createServer();

//-------------------------------------------------

server.use(restify.acceptParser(server.acceptable));
server.use(restify.authorizationParser());
server.use(restify.dateParser());
server.use(restify.queryParser());
server.use(restify.jsonp());
server.use(restify.gzipResponse());
server.use(restify.bodyParser());


//-------------------------------------------------
// 请求开始抓取 keywords 公司信息
server.post('/post/registration', RegServer.getRegistration)
// 抓取工商公示信息
server.post('/post/credit', RegServer.getCredit)
 // 抓取更多字号信息
server.post('/post/more', RegServer.moreRegistration) 
// 获取企业登记信息网站中的企业条数和页数
server.post('/history/number', historyLists.getListsNum);

server.post('/history/list', historyLists.getListsInfo);

server.post('/history/lists/basic', historyLists.getListsBasic);

server.post('/history/lists/detail', historyLists.getListsDetail)

server.post('/history/all', historyLists.getBasicDetail);
//-------------------------------------------------

server.listen(serversettings.port, function() {
  console.log('listening: %s', server.url);
})


