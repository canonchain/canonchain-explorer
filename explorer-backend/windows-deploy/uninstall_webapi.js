let Service = require('node-windows').Service;
let path = require('path');
let pathStr = path.join(__dirname, '../webapi/bin/www');
console.log("local:", pathStr);

//浏览器服务
let explorerSvc = new Service({
    name: 'wifisong.canonchain.explorer.webapi',    //服务名称
    description: 'CanonChain的浏览器服务', //描述
    script: pathStr
});

explorerSvc.on('uninstall', function () {
    console.log('wifisong.canonchain.explorer.webapi Uninstall Complete.');
    console.log('The service exists: ', explorerSvc.exists);
});
explorerSvc.uninstall();
