let Service = require('node-windows').Service;
let path = require('path');
let pathStr = path.join(__dirname, '../mapping/generate_tx.js');
console.log("local:", pathStr);
//数据库服务
let databaseSvc = new Service({
    name: 'wifisong.canonchain.mapping.generate_tx',    //服务名称
    description: 'CanonChain映射的发送服务', //描述
    script: pathStr //nodejs项目要启动的文件路径
});

databaseSvc.on('install', () => {
    console.log(databaseSvc.name + "Install Success")
    databaseSvc.start();
});
databaseSvc.install();