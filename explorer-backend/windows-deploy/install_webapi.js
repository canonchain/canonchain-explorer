let Service = require('node-windows').Service;
let path = require('path');
let pathStr = path.join(__dirname, '../webapi/bin/www');

console.log("local:", pathStr);
//数据库服务
let databaseSvc = new Service({
    name: 'wifisong.canonchain.explorer.webapi',    //服务名称
    description: 'CanonChain的浏览器的数据支撑服务', //描述
    script: pathStr //nodejs项目要启动的文件路径
});

databaseSvc.on('install', () => {
    console.log("wifisong.canonchain.explorer.webapi' Install Success")
    databaseSvc.start();
});
databaseSvc.install();