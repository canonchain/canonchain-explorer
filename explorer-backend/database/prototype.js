/* 
status - 
mci - 判断is_witness
组装prototype
检索服务器有的数据，写原形；
*/

let pgclient = require('./PG');// 引用上述文件
pgclient.getConnection();
let log4js = require('./log_config');
let logger = log4js.getLogger('write_prototype');

let timer = null;
let NEXT_TIME = 10;
let WAITE_TIME = 5000;
let dbLastPkid = 0;
let currentPkid = 0;
let DEV = 0;

// 读数据
let LIMITVAL = 10;//每页显示条数
let currentHashAry = [];//当前操作的Blocks
let sources_ary = [];//当前要写prototype的item

let pageUtility = {
    init(time) {
        timer = setTimeout(function () {
            pageUtility.getPrototypePkid()
        }, time)
    },
    //获取已经写过原型的Pkid
    getPrototypePkid() {
        let SearchOptions = {
            text: "select last_pkid from prototype_pkid order by proto_id desc limit 1"
        };
        pgclient.query(SearchOptions, (data) => {
            if (data.length === 0) {
                dbLastPkid = 0;
            } else if (data.length === 1) {
                dbLastPkid = Number(data[0].last_pkid);
            } else if (data.length > 1) {
                logger.info("get getPrototypePkid is Error");
                return;
            }
            logger.info(`dbLastPkid:${dbLastPkid}`);
            pageUtility.getBlocksByDb();
        })
    },

    //从过Pkid从交易表获取Items
    getBlocksByDb() {
        currentHashAry =[];
        pgclient.query('Select pkid,hash FROM transaction where pkid > $1 order by pkid LIMIT $2', [dbLastPkid, LIMITVAL], (blockData) => {
            logger.info("从交易表拿到了Block")
            if (!blockData.length) {
                //已经写完了，等几秒再开始写
                pageUtility.init(WAITE_TIME);
            } else {
                currentPkid = blockData[blockData.length - 1].pkid;
                logger.info(`最后一项pkid:${currentPkid}`)
                blockData.forEach(element => {
                    currentHashAry.push(element.hash);
                });
                logger.info("currentHashAry为搜索parents表准备")
                logger.info(currentHashAry);
                pageUtility.getParentsByDb();
            }
        })
    },

    //从Parents表获取对应Parents
    getParentsByDb() {
        pgclient.query('Select item,parent,is_witness,prototype FROM parents where item = any ($1)', [currentHashAry], (parentsRes) => {
            sources_ary = parentsRes;
            logger.info("从parents表拿到了需要处理的源数据")
            logger.info(sources_ary)
            pageUtility.writePrototype();
        })
    },

    //写原型
    writePrototype() {
        let inDbParents = [];//已经在数据里的数据
        let allUnit = [];//当前所有的unit 可能很多重复的
        let allParent = [];//当前所有的parent 可能很多重复的
        sources_ary.forEach(item => {//4W- 3ms
            allUnit.push(item.item);
            allParent.push(item.parent);
        });
        logger.info("allunit")
        logger.info(allUnit);
        logger.info("allParent");
        logger.info(allParent);

        /* 
        写unit对应 prototype 值:
        1.unit对应parent的是在哪里，可能存在当前数组，也可能在Db中；需要进行分类
        2.先批量查Db里parents的is_witness
            T:则unit的 prototype 为 parent
            F:则unit的 prototype 为 parent.prototype
        3.再把存在当前数据里的进行处理
        */
        sources_ary.forEach((item, index) => {
            if (allUnit.indexOf(item.parent) < 0) {
                if (inDbParents.indexOf(item.parent) < 0) {
                    inDbParents.push(item.parent);//存在Db里
                }
            }
        })
        logger.info("in db parents")
        logger.info(inDbParents);
        //profiler.stop("writePrototype前置处理");
        let searchParentsSql = {
            text: "select item,parent,is_witness,prototype from parents where item = ANY ($1)",
            values: [inDbParents]
        };
        // profiler.start();
        pgclient.query(searchParentsSql, (parentsRes) => {
            // profiler.stop("SQL=> SearchFromParents");
            // profiler.start();
            let itemIndex = 0;//索引
            let dbHashParent = [];//数据库查出来的，可能很多重复的
            let targetDbParent = {};
            // logger.info(parentsRes);
            logger.info(`需更新prototype:${allUnit.length} DB存在Parent的item数${inDbParents.length} DB中存在parent条数:${parentsRes.length}`)
            logger.info(parentsRes);
            logger.info("parent Start")
            //根据数据库的写当前的prototype
            if (parentsRes.length > 0) {
                //测试的START
                let hubObj = pageUtility.writeHub(parentsRes);//解决dbHashParent里可能多条相同parent TODO 需要优化，现在3S时间
                logger.info(hubObj);
                logger.info("   hubObj End")
                parentsRes.forEach(item => {//4W- 3ms
                    dbHashParent.push(item.item);//可能很多重复的item
                });
                logger.info("   dbHashParent End")
                //TODO 下面时间是2S
                sources_ary.forEach((currentItem, index) => {
                    /* 
                        如果DE指向C，C指向AB；
                        C的is_witness为true，则DE的prototype值均为C；
                        C的is_witness为false,那么
                            D的prototype值是AB;
                            E的prototype值是AB;
                        如果C后面不是DE，而是单独一个F；
                        C的is_witness为true，则F的prototype值为C；
                        C的is_witness为false,
                            那么F的prototype为AB
                    */
                    itemIndex = dbHashParent.indexOf(currentItem.parent);
                    if (itemIndex > -1) {
                        targetDbParent = parentsRes[itemIndex]
                        // dbHashParent[itemIndex] = 'IS_GET';//不能该写，可能多个Unit指向同一个数据库搜出的原型的
                        // console.log(targetDbParent.item);
                        // console.log(hubObj[targetDbParent.item]);
                        if (targetDbParent.is_witness) {
                            //当前是witness
                            sources_ary[index].prototype = targetDbParent.item;
                        } else {
                            //非witness
                            sources_ary[index].prototype = hubObj[targetDbParent.item];
                        }
                    }

                })
                logger.info("   sources_ary End")
                //测试的END
            }
            logger.info("parent End")

            //根据当前的写当前的prototype
            let targetLocItem = {};
            let localHubObj = pageUtility.helpLocalHub(sources_ary);//{ A: [ 0 ], B: [ 1 ], C: [ 2, 4 ], F: [ 3 ], D: [ 5, 6 ] }
            let curItemIndexs = [];
            logger.info(localHubObj);
            logger.info("local Start")
            sources_ary.forEach((currentItem, index) => {//0.64
                curItemIndexs = localHubObj[currentItem.parent];// 4 5
                logger.info(currentItem.item, index , currentItem.parent,curItemIndexs);

                if (!curItemIndexs) {
                    return;
                }
                // if (currentItem.prototype!=='null') {
                //     logger.info(`currentItem.prototype可能非空的:${currentItem.prototype} 断言成功？如果看到这句输出就要改代码逻辑`)
                // }

                targetLocItem = sources_ary[curItemIndexs[0]];//*******
                logger.info(targetLocItem)
                if (targetLocItem.is_witness) {
                    currentItem.prototype = targetLocItem.item;
                } else {
                    /* 
                        需要判断是否为枢纽，
                            1.非见证人
                            2.多个原型
                        =如果多个原型，则取出对应的原型
                            fn(sources_ary , targetLocItem.item) => 'B,C,D'
                    */
                    //如果是枢纽，prototype的是item.item;
                    curItemIndexs.forEach(indeItem => {
                        targetLocItem = sources_ary[indeItem];
                        if (!currentItem.prototype) {
                            currentItem.prototype = targetLocItem.prototype;
                        } else {
                            currentItem.prototype += ("," + targetLocItem.prototype)
                        }
                    })
                }
                logger.info(currentItem.prototype)
            })
            logger.info("local End")
            pageUtility.writePrototypeToDb();
        })
    },

    //把prototype写进parents表
    writePrototypeToDb() {
        /*
        update parents set prototype=tmp.prototype
        from (values
              ('B5956299E1BC73B23A56D4CC1C58D42F2D494808FBDEE073259B48F571CCE97C','XXXXXX'),
              ('5F2B6FA741A33CDD506C5E150E37FCC73842082B24948A7159DFEB4C07500A08','YYYYYY')
             )
        as tmp (item,prototype) where parents.item=tmp.item
        * */

        let tempAry = [];
        sources_ary.forEach((item) => {
            tempAry.push(
                "('" +
                item.item + "','" +
                item.parent + "','" +
                item.prototype + "'" +
                ")");
        });
        logger.info("写原型 开始")
        logger.info(sources_ary)
        if (tempAry.length) {
            let batchUpdateSql = 'update parents set prototype=tmp.prototype from (values' + tempAry.toString() +
                ') as tmp (item,parent,prototype) where parents.item=tmp.item and parents.parent=tmp.parent';
                logger.info(tempAry)
                logger.info(batchUpdateSql)
            pgclient.query(batchUpdateSql, (res) => {
                logger.info("写原型 结束")
                let typeVal = Object.prototype.toString.call(res);
                if (typeVal === '[object Error]') {
                    logger.info(`writePrototypeToDb 失败 ${res}`);
                } else {
                    logger.info(`writePrototypeToDb 成功`);
                    pageUtility.writePkidToDb();
                }
            });
        }else{
            pageUtility.init(NEXT_TIME);
        }
    },

    //写Pkid进Db
    writePkidToDb() {
        const mciText = 'INSERT INTO prototype_pkid(last_pkid) VALUES($1)';
        const pkidValues = [Number(currentPkid)];
        pgclient.query(mciText, pkidValues, (res) => {
            let typeVal = Object.prototype.toString.call(res);
            if (typeVal === '[object Error]') {
                logger.info(`last_pkid插入失败 ${res}`);
            } else {
                DEV++;
                logger.info(`last_pkid插入成功`);
            }
        })
    },

    writeHub(arr) {
        let obj = {};
        logger.info("writeHub")
        for (let i = 0; i < arr.length; i++) {
            let currentItem = arr[i];
            //currentItem.prototype 可能是 'AAA,BBB'
            let protoAry = currentItem.prototype.split(',');
            if (!obj[currentItem.item]) {
                obj[currentItem.item] = {
                    item: currentItem.item,
                    prototype: protoAry
                };
            } else {
                protoAry.forEach(item => {
                    if (obj[currentItem.item].prototype.indexOf(item) < 0) {
                        obj[currentItem.item].prototype.push(item);
                    }
                })
            }

        }
        /* 
        { '2319A50CBBAE851327E2B411430EE5718EB6415AC85FC6123853813C5F0F1D63': 
                { 
                    item: '2319A50CBBAE851327E2B411430EE5718EB6415AC85FC6123853813C5F0F1D63',
                    prototype: [ 
                        'ECE786885C9985104DB676A22442784DB1C7CBCC719CC3527B01417A950A4F88',
                        'ECE786885C9985104DB676A22442784DB1C7CBCC719CC3527B01417A950A4F88' 
                    ]
                } 
        }
        */
       logger.info("writeHub End")
       for(let key in obj){
           obj[key].prototype = obj[key].prototype.join(',');
       }
       logger.info(obj);
       logger.info("writeHub 格式化")
        return obj;
    },
    helpLocalHub(ary) {
        let tempObj = {};
        ary.forEach((item, index) => {
            if (!tempObj[item.item]) {
                tempObj[item.item] = [index]
            } else {
                tempObj[item.item].push(index);
            }
        });
        /* 
        { 
            '1B88AAA2F75A8703C2501E905D119A8B034D6511D48EAFB1B136ED1AA0DDB7A7': [ 0 ],
            '759B312D4A616EC7976441E2673F6C3AD063024C236FDBF6EA1B5A158B51E043': [ 1 ],
            A277F6F9CED969BF0292B29D9E235C27E8DF7DE074CF5A444583051D487A6159: [ 2 ],
            CC618B4566EBBAFC0EF59E5F3F9F7B0880EB578C7FABEC2D5535C91C870C64AA: [ 3 ],
            F76928F5F1594CF8EA98E25D23A963113236FB12E3E52FBDC1AB4CFD2BFEDA26: [ 4, 5 ],
            '71647A173602D5E1F1E2248981C82B0C6F3E937B0AF34D8E71E8C09F08F5E20D': [ 6 ],
            D4EE0BED3E740C96B98C31CA3B29A537F935FD4BF62D9D80EC30BA55C0464DC7: [ 7 ],
            '29BFBA2C3A3721AFECB1ACCBD18E90D5C9F69F509205C9DF0B207CFC7BF82D2B': [ 8 ],
            ED70C7E7E7A9CE795A55FBEF7EE46B8E210CC097A360A0664859DFF40D8F4D08: [ 9 ] 
        }
        */
        return tempObj;
    }
}
pageUtility.init(NEXT_TIME);