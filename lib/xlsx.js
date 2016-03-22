var HistoryDb = require("../collection/history");
var historyDb = new HistoryDb();

var XLSX = require('xlsx');

// -----------------------------------------------------------------
function log(info) {
  console.log("-----------------------------------");
  var length = arguments.length;
  for (var i = 0; i < length; i++) {
    console.log(arguments[i]);
  }
}

// -----------------------------------------------------------------

var nameLists = [{
  value: 'shanghai1'
}, {
  value: 'shanghai2'
}, {
  value: 'shanghai3'
}];


function HandleXLSX(name, callback) {
  var path = '../doc/' + name + '.xlsx';
  log(path)
  var workbook = XLSX.readFile(path);

  var first_sheet_name = workbook.SheetNames[0];

  var worksheet = workbook.Sheets[first_sheet_name];

  var companyLists = [];
  var valueLength = 0;

  for (z in worksheet) {
    if (z[0] !== '!') {
      valueLength++;
    }
  }

  for (var i = 1; i < valueLength; i++) {
    var company = worksheet['A' + i];
    var date = worksheet['E' + i];
    if (typeof(company) === 'object' && company.hasOwnProperty("v") && typeof(date) === 'object' && date.hasOwnProperty("v")) {
      companyLists.push({
        companyName: company.v,
        acceptedDate: date.v,
        applyStatus: '可领照'
      });
    }

  }
  callback(companyLists)
}


nameLists.forEach(function(list) {
  HandleXLSX(list.value, function(companyLists) {
    historyDb.saveLists(companyLists);
  })
})