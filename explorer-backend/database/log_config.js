let log4js = require('log4js');
let path = require('path');
let fs = require('fs');

let basePath = path.join(__dirname, '../data_logs/');
let defaultPath = path.join(basePath, '/default_database/');
let writeDbPath = path.join(basePath, '/write_database/');
let mappingWriteSql = path.join(basePath, '/mapping_write_sql/');
let mappingGenerateSql = path.join(basePath, '/mapping_generate_sql/');
let webapiLog = path.join(basePath, '/webapi_log/');
let readDbPath = path.join(basePath, '/read_database/');
let sqlPath = path.join(basePath, '/pg_sql/');

let confirmPath = function (pathStr) {
    if (!fs.existsSync(pathStr)) {
        fs.mkdirSync(pathStr);
    }
};
//创建log的根目录'logs'
if (basePath) {
    confirmPath(basePath);
    //根据不同的logType创建不同的文件目录
    confirmPath(defaultPath);
    confirmPath(writeDbPath);
    confirmPath(mappingWriteSql);
    confirmPath(mappingGenerateSql);
    confirmPath(webapiLog);
    confirmPath(readDbPath);
}

log4js.configure({
    appenders: {
        out: { type: 'console' },
        default: {
            type: 'dateFile',
            filename: defaultPath,
            "pattern": "yyyy-MM-dd-hh.log",
            alwaysIncludePattern: true
        },
        write_db: {
            type: 'dateFile',
            filename: writeDbPath,
            "pattern": "yyyy-MM-dd-hh.log",
            alwaysIncludePattern: true
        },
        mapping_write_sql: {
            type: 'dateFile',
            filename: mappingWriteSql,
            "pattern": "yyyy-MM-dd-hh.log",
            alwaysIncludePattern: true
        },
        mapping_generate_sql: {
            type: 'dateFile',
            filename: mappingGenerateSql,
            "pattern": "yyyy-MM-dd-hh.log",
            alwaysIncludePattern: true
        },
        webapi_log: {
            type: 'dateFile',
            filename: webapiLog,
            "pattern": "yyyy-MM-dd-hh.log",
            alwaysIncludePattern: true
        },
        read_db: {
            type: 'dateFile',
            filename: readDbPath,
            "pattern": "yyyy-MM-dd-hh.log",
            alwaysIncludePattern: true
        },
        pg_sql: {
            type: 'dateFile',
            filename: sqlPath,
            "pattern": "yyyy-MM-dd-hh.log",
            alwaysIncludePattern: true
        }
    },
    categories: {
        default: {
            appenders: ['default'],
            level: 'info'
        },
        write_db: {
            appenders: ['write_db'],
            level: 'info'
        },
        mapping_write_sql: {
            appenders: ['mapping_write_sql'],
            level: 'info'
        },
        mapping_generate_sql: {
            appenders: ['mapping_generate_sql'],
            level: 'info'
        },
        webapi_log: {
            appenders: ['webapi_log'],
            level: 'info'
        },
        read_db: {
            appenders: ['read_db'],
            level: 'info'
        },
        pg_sql: {
            appenders: ['pg_sql'],
            level: 'info'
        }
    },
    replaceConsole: true              //是否替换console.log
});


module.exports = log4js;