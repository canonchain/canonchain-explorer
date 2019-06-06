let Czr = require("czr");
let czr = new Czr();
let log4js = require('../log_config');
let logger = log4js.getLogger('TEST');//此处使用category的值
let profiler = require("../profiler");

// console.log(`获取网络中最新稳定的MCI-Start`);

let dbStableMci =0;
let statusMci = 0;
let MCI_LIMIT   = 100;
let next_index  = '';
let MAX = 50000;
let timer =null;

let pageUtility={
    getStatus(){
        czr.request.status().then(function (status) {
            console.log(`获取网络中最新稳定的MCI-Success : `);
            console.log(status)
            statusMci = Number(status.last_stable_mci); 
            // pageUtility.getMci();
        }).catch((err)=>{
            console.log(`获取网络中最新稳定的MCI-Error : ${err}`);
        })
    },
    getMci(){
        logger.info(`通过 ${dbStableMci} ${MCI_LIMIT} ${next_index} 获取blocks ===============================`);
        profiler.start();
        czr.request.mciBlocks(dbStableMci,MCI_LIMIT,next_index).then(function (data) {
            profiler.stop('RPC=> mciBlocks');
            logger.info(`拿到了结果 ${dbStableMci} ${MCI_LIMIT} => ${data.next_index}`);
            next_index = data.next_index ? data.next_index : '';
            if(!next_index){
                dbStableMci++;
            }

            if((dbStableMci%1000==0)&&dbStableMci!==0){
                console.log(dbStableMci);
                profiler.print();
            }
            timer= setTimeout(()=>{
                pageUtility.getMci();
            },50)
        });
    }
}
pageUtility.getStatus();