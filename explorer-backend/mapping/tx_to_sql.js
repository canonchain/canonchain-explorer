

(async () => {
    const Web3 = require("./node_modules/web3")
    const key = require("./infura_key")
    const web3 = new Web3('https://rinkeby.infura.io/' + key);
    let Czr = require("./node_modules/czr");
    let czr = new Czr();
    let pgPromise = require("../database/PG-promise");
    const ABI = [

        {
            type: 'bytes',
            name: 'czrAccount'
        },
        {
            type: 'address',
            name: 'ethAddress'
        },
        {
            type: 'uint256',
            name: 'timestamp'
        },
        {
            type: 'uint256',
            name: 'value',
            indexed: true
        }
    ];
    let contractOpt = {
        address: "0xc3d28a40033bbabe5017edf351c6718e1b665a50",
        "fromBlock": "0x46B52E",
        "toBlock": "latest",
        topics: ["0x94fcee0b7b95ac21ec59ec2c5b2e99e75c909351baf99e93cd97e713d820627b"]
    };

    let pageUtility = {
        init() {
            pageUtility.getContractInfo()
        },
        async getContractInfo() {
            let resuleInfo = await web3.eth.getPastLogs(contractOpt);
            console.log("拿到了")
            console.log(resuleInfo)
            // let resuleInfo = [
            //     {
            //         address: '0xc3D28a40033BbaBE5017EDF351c6718E1B665a50',
            //         blockNumber: 4695771,
            //         data: '0x0000000000000000000000000000000000000000000000000000000000000060000000000000000000000000e6a7bc2c96e4374ebcdb23aedcbb6ef1eb3d4c83000000000000000000000000000000000000000000000000000000005d22def100000000000000000000000000000000000000000000000000000000000000201111111111111111111111111111111111111111111111111111111111111111',
            //         topics:
            //             [
            //                 '0x94fcee0b7b95ac21ec59ec2c5b2e99e75c909351baf99e93cd97e713d820627b',//Tops
            //                 '0x00000000000000000000000000000000000000000000000000000000000003e8' //金额
            //             ],
            //         removed: false,
            //         transactionHash: '0x23d4ad7291217dcc30d531ec32d38902081ec336e06c07feadd108179bc6f128',//交易hash
            //     }
            // ]
            pageUtility.parseContractInfo(resuleInfo);
        },
        async parseContractInfo(resuleInfo) {
            let logAry = []
            await Promise.all(resuleInfo.map(async (item) => {
                if (!item.removed) {
                    let decodeLogInfo = await web3.eth.abi.decodeLog(
                        ABI,
                        item.data,
                        [item.topics[1]]
                    );
                    let insertLog = {
                        timestamp: decodeLogInfo.timestamp.toString(10),
                        tx: item.transactionHash,
                        eth_address: decodeLogInfo.ethAddress,
                        czr_account: czr.utils.encode_account(decodeLogInfo.czrAccount),
                        value: decodeLogInfo.value.toString(10),
                        status: 1
                    }
                    logAry.push(insertLog);
                } else {
                    console.log("为True，不处理")
                }
            }))
            console.log("准备插入数组")
            pageUtility.insertSql(logAry);
        },
        async insertSql(array) {
            let tempAry = [];
            array.forEach(element => {
                tempAry.push(`
                (
                    ${Number(element.timestamp)},
                    '${element.tx}',
                    '${element.eth_address}',
                    '${element.czr_account}',
                    ${Number(element.value)},
                    ${Number(element.status)}
                )
                `)
            });
            let batchInsertSql = {
                text: `
                INSERT INTO 
                    mapping_log (
                        "timestamp",
                        "tx",
                        "eth_address",
                        "czr_account",
                        "value",
                        "status"
                    ) 
                VALUES` + tempAry.toString()
            };
            try {
                await pgPromise.query(batchInsertSql);
            }
            catch (e) {
                console.log("插入失败")
                console.log(e)
            }
        },
        async searchFromBlock() {
            let SearchOptions = {
                text: `
                    select 
                        value 
                    from 
                        global 
                    where 
                        "key" = $1
                `,
                values: ["from_block"]
            };
            let data = await pgPromise.query(SearchOptions);
            return data.rowCount;
        },
        async updateFromBlock(value) {
            let updateBlock = {
                text: `
                    update 
                        "global"
                    set 
                        "value"=$1 
                    where 
                        key = 'from_block'
                `,
                values: [value]
            };
            try {
                await pgPromise.query(updateBlock);
            } catch (error) {
                console.log(error);
            }
        }
    }
    pageUtility.init();
})()