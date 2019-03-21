let pgclient = require('./PG').default;// 引用上述文件
pgclient.getConnection();
let log4js = require('./log_config');
let logger = log4js.getLogger('write_prototype');

let timer = null;
let NEXT_TIME = 10;
let WAITE_TIME = 5000;
let dbLastPkid = 0;
let currentPkid = 0;

// 读数据
let LIMITVAL = 10;//每页显示条数
let currentHashAry = [];//当前操作的Blocks
let sources_ary = [];//当前要写prototype的item

// 辅助变量
let inDbParentsAry = [];//已经在数据里的数据
let currentAllUnit = [];//当前所有的unit 可能很多重复的
let parentItemIndex;
let dbAllHashAry;
let targetDbParentObj;
let parentHubObj;
let targetLocObj,localHubObj,localItemIndexs,helpProtoPush;

//SQL
let SQL_search_pkid = { text: "select last_pkid from prototype_pkid order by proto_id desc limit 1" };
let SQL_search_hash_base_trans = 'Select pkid,hash FROM transaction where pkid > $1 order by pkid LIMIT $2';
let searchParentsSql;


let pageUtility = {
    init(time) {
        timer = setTimeout(function () {
            pageUtility.getPrototypePkid()
        }, time)
    },
    //获取已经写过原型的Pkid
    getPrototypePkid() { 
        pgclient.query(SQL_search_pkid, (data) => {
            if (data.length === 0) {
                dbLastPkid = 0;
            } else if (data.length === 1) {
                dbLastPkid = Number(data[0].last_pkid);
            } else if (data.length > 1) {
                logger.info("get getPrototypePkid is Error");
                return;
            }
            pageUtility.getBlocksByDb();
        })
    },

    //从过Pkid从交易表获取Items
    getBlocksByDb() {
        pgclient.query(SQL_search_hash_base_trans, [dbLastPkid, LIMITVAL], (blockData) => {
            if (!blockData.length) {
                //已经写完了，等几秒再开始写
                pageUtility.init(WAITE_TIME);
            } else {
                currentPkid = blockData[blockData.length - 1].pkid;
                logger.info(`拿到了数据，并且最后一项pkid:${currentPkid}`)
                blockData.forEach(element => {
                    currentHashAry.push(element.hash);
                });
                pageUtility.getParentsByDb();
            }
        })
    },

    //从Parents表获取对应Parents
    getParentsByDb() {
        pgclient.query('Select item,parent,is_witness,prototype FROM parents where item = any ($1)', [currentHashAry], (parentsRes) => {
            currentHashAry =[];
            sources_ary = parentsRes;
            logger.info("从parents表拿到了需要处理的源数据")
            pageUtility.writePrototype();
        })
    },

    //写原型
    writePrototype() { 
        sources_ary.forEach(item => {//4W- 3ms
            currentAllUnit.push(item.item);
        });

        /* 
        写unit对应 prototype 值:
        1.unit对应parent的是在哪里，可能存在当前数组，也可能在Db中；需要进行分类
        2.先批量查Db里parents的is_witness
            T:则unit的 prototype 为 parent
            F:则unit的 prototype 为 parent.prototype
        3.再把存在当前数据里的进行处理
        */
        sources_ary.forEach((item, index) => {
            if (currentAllUnit.indexOf(item.parent) < 0) {
                if (inDbParentsAry.indexOf(item.parent) < 0) {
                    inDbParentsAry.push(item.parent);//存在Db里
                }
            }
        })
        //profiler.stop("writePrototype前置处理");
        searchParentsSql = {
            text: "select item,parent,is_witness,prototype from parents where item = ANY ($1)",
            values: [inDbParentsAry]
        };
        // profiler.start();
        pgclient.query(searchParentsSql, (parentsRes) => {
            // profiler.stop("SQL=> SearchFromParents");
            // profiler.start();
            parentItemIndex = 0;//索引
            dbAllHashAry = [];//数据库查出来的，可能很多重复的
            targetDbParentObj = {};
            logger.info(`需更新prototype:${currentAllUnit.length} DB存在Parent的item数${inDbParentsAry.length} DB中存在parent条数:${parentsRes.length}`)
            inDbParentsAry =[];
            currentAllUnit =[];

            //根据数据库的写当前的prototype
            if (parentsRes.length > 0) {
                //测试的START
                parentHubObj = pageUtility.writeHub(parentsRes);//解决dbHashParent里可能多条相同parent
                parentsRes.forEach(item => {//4W- 3ms
                    dbAllHashAry.push(item.item);//可能很多重复的item
                });
                
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
                    parentItemIndex = dbAllHashAry.indexOf(currentItem.parent);
                    if (parentItemIndex > -1) {
                        targetDbParentObj = parentsRes[parentItemIndex]
                        // dbAllHashAry[parentItemIndex] = 'IS_GET';//不能该写，可能多个Unit指向同一个数据库搜出的原型的
                        if (targetDbParentObj.is_witness) {
                            //当前是witness
                            sources_ary[index].prototype = targetDbParentObj.item;
                        } else {
                            //非witness
                            sources_ary[index].prototype = parentHubObj[targetDbParentObj.item].prototype;
                        }
                    }
                })
                logger.info("   sources_ary End")
                //测试的END
            }
            logger.info("parent End")

            //根据当前的写当前的prototype
            targetLocObj = {};
            localHubObj = pageUtility.helpLocalHub(sources_ary);//{ A: [ 0 ], B: [ 1 ], C: [ 2, 4 ], F: [ 3 ], D: [ 5, 6 ] }
            localItemIndexs = [];
            sources_ary.forEach((currentItem, index) => {//0.64
                localItemIndexs = localHubObj[currentItem.parent];// 4 5
                if (!localItemIndexs) {
                    return;
                }
                targetLocObj = sources_ary[localItemIndexs[0]];
                if (targetLocObj.is_witness) {
                    currentItem.prototype = targetLocObj.item;
                } else {
                    /* 
                        需要判断是否为枢纽，
                            1.非见证人
                            2.多个原型
                        =如果多个原型，则取出对应的原型
                            fn(sources_ary , targetLocObj.item) => 'B,C,D'
                    */
                    //如果是枢纽，prototype的是item.item;
                    localItemIndexs.forEach(indeItem => {
                        targetLocObj = sources_ary[indeItem];
                        if (!currentItem.prototype) {
                            currentItem.prototype = targetLocObj.prototype;
                        } else {
                            if(currentItem.prototype.indexOf(targetLocObj.prototype)<0){
                                helpProtoPush = targetLocObj.prototype.split(",");
                                helpProtoPush.forEach(proItem=>{
                                    if(currentItem.prototype.indexOf(proItem)<0){
                                        currentItem.prototype += (","+ proItem)
                                    }
                                });
                            }
                        }
                    })
                }
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
        sources_ary =[];
        console.log(tempAry.length);
        if (tempAry.length) {
            let batchUpdateSql = 'update parents set prototype=tmp.prototype from (values' + tempAry.toString() +
                ') as tmp (item,parent,prototype) where parents.item=tmp.item and parents.parent=tmp.parent';
            pgclient.query(batchUpdateSql, (res) => {
                if (Object.prototype.toString.call(res) === '[object Error]') {
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
        pgclient.query('INSERT INTO prototype_pkid(last_pkid) VALUES($1)', [Number(currentPkid)], (res) => { 
            if (Object.prototype.toString.call(res) === '[object Error]') {
                logger.info(`last_pkid插入失败 ${res}`);
            } else {
                logger.info(`last_pkid插入成功`);
                pageUtility.init(NEXT_TIME);
            }
        })
    },

    writeHub(arr) {
        let obj = {};
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
       for(let key in obj){
           obj[key].prototype = obj[key].prototype.join(',');
       }
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