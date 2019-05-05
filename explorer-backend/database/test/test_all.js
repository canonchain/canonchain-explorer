var pgclient = require('../PG').default;// 引用上述文件
pgclient.getConnection();

// var account = {
//     account :"czr_1ozdqi5yzzgm9wwbb58kt86635uygnaxksh4w1nmqo1z6hpxm5cetogpgpqi",
//     type :1,
//     tran_count :2,
//     balance :1234567890.123456789012345678,
// }


// const text = 'INSERT INTO accounts(account,type,tran_count,balance) VALUES($1,$2,$3,$4)'
// const values = [
//     'czr_3b7zjk1uuorkjgsxkyhr6nadm8uba74q1si3himeqasfsotrikfs8xqiwibe', 
//     1,
//     2,
//     "1"
// ]
//RUN=> client.query(INSERT INTO accounts(account,type,tran_count,balance) VALUES($1,$2,$3,$4) , czr_1ozdqi5yzzgm9wwbb58kt86635uygnaxksh4w1nmqo1z6hpxm5cetogpgpqi,1,2,1234567890.1234567 )

// pgclient.query(text,values,(res)=>{
//     console.log("select result",res)
// });
//Select * FROM accounts ORDER BY balance DESC
// pgclient.query("Select * FROM accounts  WHERE account = $1",[ 'czr_1ijwjks3praki6zj18uspsdsoi41zsuwwy3cnts6t5ra7gm6ygxyd7yrudbh' ], (res) => {
//     console.log("select result", res)
// });

//删除 client.query("DELETE FROM test WHERE name=$1", ["xiaoming"])})
// pgclient.query("DELETE FROM accounts  WHERE account = $1",[ 'czr_1ozdqi5yzzgm9wwbb58kt86635uygnaxksh4w1nmqo1z6hpxm5cetogpgpqi' ], (res) => {
//     console.log("select result", res)
// });


var options = {
    "hash": "682C38ACAF122BF6778A7BF7F64D06159C1B4C86149054979327F768E775B5BB",
    "from": "czr_1ijwjks3praki6zj18uspsdsoi41zsuwwy3cnts6t5ra7gm6ygxyd7yrudbh",
    "to": "czr_3b7zjk1uuorkjgsxkyhr6nadm8uba74q1si3himeqasfsotrikfs8xqiwibe",
    "amount": "12.123456789012345678",
    "previous": "FECE5E4638E9ED75B289B38309976E3B0A41731F52ACD98E01B0FB24357CE487",
    "witness_list_block": "3B3913B57AA353BFA4C722EEC259FCCA0028A5D1D4C2D62883A4151D0267A743",
    "last_summary": "1017E898B6D12A1C7C6499B318A237E9FD9D58EF968A9B75BDB47DA6CDCC33DE",
    "last_summary_block": "31F73F3FF1FCFD57417C3F62E27CBD1CDFF5750513F505220AEC51AB422AFFA5",
    "data": "",
    "exec_timestamp": 1530719690,
    "signature": "C4180F34AA45A17AAD15F32AB8FDA04A9200738C84C7A6D8697CF73C1D9A33F6594EB61BA7880B3D5FD0005491AC1F655A5AE612AC76B18FDEFC270DB7DF690D",
    "is_free": false,
    "level": 1840,
    "witnessed_level": 1833,
    "best_parent": "E337E4AB80F2E7BC8634D1F7B3339DE4EB35C855D6D35DDC9517987A7991B185",
    "is_stable": true,
    "is_fork": false,
    "is_invalid": false,
    "is_fail": false,
    "is_on_mc": true,
    "mci": 1810,
    "latest_included_mci": 1809,
    "mc_timestamp": 1530719690
}

const blockText = 'INSERT INTO transaction(hash,"from","to",amount,previous,witness_list_block,last_summary,last_summary_block,data,exec_timestamp,signature,is_free,level,witnessed_level,best_parent,is_stable,is_fork,is_invalid,is_fail,is_on_mc,mci,latest_included_mci,mc_timestamp) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23)'
const blockValues = [
    "682C38ACAF122BF6778A7BF7F64D06159C1B4C86149054979327F768E775B999",
    "czr_1ijwjks3praki6zj18uspsdsoi41zsuwwy3cnts6t5ra7gm6ygxyd7yrudbh",
    "czr_3b7zjk1uuorkjgsxkyhr6nadm8uba74q1si3himeqasfsotrikfs8xqiwibe",
    "15.123456789012345678",
    "FECE5E4638E9ED75B289B38309976E3B0A41731F52ACD98E01B0FB24357CE487",
    "3B3913B57AA353BFA4C722EEC259FCCA0028A5D1D4C2D62883A4151D0267A743",
    "1017E898B6D12A1C7C6499B318A237E9FD9D58EF968A9B75BDB47DA6CDCC33DE",
    "31F73F3FF1FCFD57417C3F62E27CBD1CDFF5750513F505220AEC51AB422AFFA5",
    "",
    1530719789,
    "C4180F34AA45A17AAD15F32AB8FDA04A9200738C84C7A6D8697CF73C1D9A33F6594EB61BA7880B3D5FD0005491AC1F655A5AE612AC76B18FDEFC270DB7DF690D",
    false,
    1840,
    1833,
    "E337E4AB80F2E7BC8634D1F7B3339DE4EB35C855D6D35DDC9517987A7991B185",
    true,
    false,
    false,
    false,
    true,
    1810,
    1809,
    1530719789
]


// pgclient.query(blockText,blockValues,(res)=>{
//     console.log("select result",res)
// });


//查看 
/* 
pgclient.query("Select * FROM accounts  WHERE account = $1", ['czr_1ozdqi5yzzgm9wwbb58kt86635uygnaxksh4w1nmqo1z6hpxm5cetogpgpq9'], (data) => {
    console.log("/get_account", data.length)

}); 
*/

//  插入
//RUN=> client.query(INSERT INTO accounts(account,type,tran_count,balance) VALUES($1,$2,$3,$4) , czr_1ozdqi5yzzgm9wwbb58kt86635uygnaxksh4w1nmqo1z6hpxm5cetogpgpqi,1,2,1234567890.1234567 )
// const accountText = 'INSERT INTO accounts(account,type,tran_count,balance) VALUES($1,$2,$3,$4)'
// const accountValues = [
//     'czr_3b7zjk1uuorkjgsxkyhr6nadm8uba74q1si3himeqasfsotrikfs8xqiwibe', 
//     1,
//     2,
//     "1"
// ]
// pgclient.query(accountText,accountValues,(res)=>{
//     console.log("select result",res)
// });

//更新
//client.query("UPDATE test SET age=$1 WHERE name=$2", [21, "xiaoming"])
/* 
client.query("UPDATE accounts SET type=$2,balance=$3,tran_count=$4, WHERE name=$1" , [
    "czr_1ozdqi5yzzgm9wwbb58kt86635uygnaxksh4w1nmqo1z6hpxm5cetogpgpqi",
    1,
    "1688",
    99
] )  
*/


/* const updateText = "UPDATE accounts SET type=$2,balance=$3,tran_count=$4, WHERE name=$1";
const updateValues = [
    "czr_1ozdqi5yzzgm9wwbb58kt86635uygnaxksh4w1nmqo1z6hpxm5cetogpgpqi",
    1,
    "1688",
    99
]
pgclient.query(updateText, updateValues, (res) => {
    console.log("updateText", res)
}); */

//upsert

/*
insert into test values (1,'test',now()) on conflict (id) do update set     info=excluded.info,crt_time=excluded.crt_time;

INSERT INTO products (
    upc,
    title,
    description,
    link)
VALUES (
    123456789,
    ‘Figment #1 of 5’,
    ‘THE NEXT DISNEY ADVENTURE IS HERE - STARRING ONE OF DISNEY'S MOST POPULAR CHARACTERS! ’,
    ‘http://www.amazon.com/dp/B00KGJVRNE?tag=mypred-20'
    )
ON CONFLICT DO UPDATE SET description=excluded.description;

* */
//Select * FROM parents WHERE item in ($1)

/*

select account from accounts where account in ('czr_3ijpzyoofukqrhjyqk5ma6c64m44fexc1idta7necszksbj6urfqq7yu3dsy','czr_1aptm6u579y1gx548hj7nmehtu3jmduxmp9pwm4abxyiartcd5kd4ofw1dyd')

*/
// let accAry = ['czr_3ijpzyoofukqrhjyqk5ma6c64m44fexc1idta7necszksbj6urfqq7yu3dsy', 'czr_1aptm6u579y1gx548hj7nmehtu3jmduxmp9pwm4abxyiartcd5kd4ofw1dyd'];
// let upsertSql = {
//     text: "select account from accounts where account = ANY ($1)",
//     values: [accAry]
// };
//
// pgclient.query(upsertSql, (res) => {
//     console.log("accounts", res)
// });

tempParentsAllAry=[
    "C469079D2879A0C2F8964D4F07B08424EEB5EF46D6BBA6A9C81D1ADF24F4A140",
    "CEF97F10C3543E8B00746CB7CA66E31A29B388D917F18E32A8677A49A2117FDE",
    "F718927AC5CF8BB3CCC8EC759508D5EAE69301E8FF7033921CDB0F66E7AAB527",
    "2F622C6B5FCCAC3F35CD0CF2D25B1093B88591BC1F2E3987CAC778B7FB66B913",
    "6E77934A8D472196D1E457F37F3B04CC0B60B61463D3072DDF18F9B4DC0528BE",
];
let upsertParentSql = {
    text: "select item from parents where item = ANY ($1)",
    values: [tempParentsAllAry]
};
/*
pgclient.query(upsertParentSql, (res) => {
    let aloneItem={};
    res.forEach((item)=>{
        aloneItem[item.item]=item.item;
    });
    console.log(res);
    console.log(aloneItem)
});*/


/*
let tempParObjAry=[
    ["94960D6352BC14287A68327373B45E0D8F21BC4C434287C893BD0DF9100E4F35","2FF3BB4217F640015171CFC207DC8BA831B98BD8160FB8D54A95B5E29BCF74AD"],
    ["94960D6352BC14287A68327373B45E0D8F21BC4C434287C893BD0DF9100E4F35","8281B037A0A930A488B1407AE9AB6425D02D277182488641238F47F6304F604A"],
    ["94960D6352BC14287A68327373B45E0D8F21BC4C434287C893BD0DF9100E4F35","C469079D2879A0C2F8964D4F07B08424EEB5EF46D6BBA6A9C81D1ADF24F4A140"]
];
let tempParObjAry2={
    '5D81C966F0E1B1DFA0F77488FD4A577BB557CBEF4C87DE39141CB0FF7639F583': [ '8281B037A0A930A488B1407AE9AB6425D02D277182488641238F47F6304F604A' ],
    '94960D6352BC14287A68327373B45E0D8F21BC4C434287C893BD0DF9100E4F35':
        [ '2FF3BB4217F640015171CFC207DC8BA831B98BD8160FB8D54A95B5E29BCF74AD',
            '8281B037A0A930A488B1407AE9AB6425D02D277182488641238F47F6304F604A',
            'C469079D2879A0C2F8964D4F07B08424EEB5EF46D6BBA6A9C81D1ADF24F4A140' ]
};
let tempAry=[];
for (let key in tempParObjAry2){
    tempParObjAry2[key].forEach((item)=>{
        tempAry.push("('"+key+"','"+item+"')");
    });
}
// console.log(tempAry.toString());
let batchInsertSql = {
    text: "INSERT INTO parents (item,parent) VALUES"+tempAry.toString()
};
pgclient.query(batchInsertSql, (res) => {
    console.log(res);
});*/

/*
accountAry=[{
    account: 'czr_341qh4575khs734rfi8q7s1kioa541mhm3bfb1mryxyscy19tzarhyiti888',
    type: 1,
    balance: '0'
},
    {
        account: 'czr_3n571ydsypy34ea5c7w6z7owyc1hxqgbnqa8em8p6bp6pkk3ii55j14bt888',
        type: 1,
        balance: '0'
    }];
let tempAry=[];
accountAry.forEach((item)=>{
    tempAry.push("('"+item.account+"',"+item.type+","+item.balance+")");
});
let batchInsertSql = {
    text: "INSERT INTO accounts (account,type,balance) VALUES"+tempAry.toString()
};
pgclient.query(batchInsertSql, (res) => {
    //ROLLBACK
});*/

/*批量更新*/
//UPDATE [MyTable] SET [MyField1]=Value1,[MyField2]=Value2 WHERE [ConditionField]=SomeValue
//UPDATE accounts SET balance=$2,count=$3 WHERE account=$1
//update accounts set balance=tmp.balance from (values ('AAA','1'),('BBB','2'),('CCC','3')) as tmp (account,balance) where accounts.account=tmp.account;

let batchUpdateSql="update transaction set is_free=tmp.is_free , is_stable=tmp.is_stable , is_fork=tmp.is_fork , is_invalid=tmp.is_invalid , is_fail=tmp.is_fail , is_on_mc=tmp.is_on_mc from (values " +
    "('B5956299E1BC73B23A56D4CC1C58D42F2D494808FBDEE073259B48F571CCE97C',false,false,false,false,false,false)," +
    "('5F2B6FA741A33CDD506C5E150E37FCC73842082B24948A7159DFEB4C07500A08',false,false,false,false,false,false)" +
    ") as tmp (hash,is_free,is_stable,is_fork,is_invalid,is_fail,is_on_mc) where transaction.hash=tmp.hash";
pgclient.query(batchUpdateSql, (res) => {
    //ROLLBACK
    console.log(res);
});