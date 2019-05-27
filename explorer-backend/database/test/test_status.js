let Czr = require("../../czr/index");
let czr = new Czr();
let log4js = require('../log_config');
let logger = log4js.getLogger('TEST');//此处使用category的值
let profiler = require("../profiler");

// console.log(`获取网络中最新稳定的MCI-Start`);

let dbStableMci = 0;
let statusMci = 0;
let MCI_LIMIT = 100;
let next_index = '';
let MAX = 50000;
let timer = null;

let pageUtility = {
    getStatus() {
        czr.request.status().then(function (status) {
            console.log(`获取网络中最新稳定的MCI-Success : `);
            console.log(status)
            statusMci = Number(status.status.last_stable_mci);
        }).catch((err) => {
            console.log(`获取网络中最新稳定的MCI-Error : ${err}`);
        })
    }
}
pageUtility.getStatus();