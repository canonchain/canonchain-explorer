let Czr = require("../czr/index");
let czr = new Czr();
console.log(`获取网络中最新稳定的MCI-Start`);
czr.request.status().then(function (status) {
    console.log(`获取网络中最新稳定的MCI-Success : `);
    console.log(status)
    return status
}).catch((err)=>{
    console.log(`获取网络中最新稳定的MCI-Error : ${err}`);
})