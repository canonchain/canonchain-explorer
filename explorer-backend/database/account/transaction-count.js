/**
 * @author fangke
 * 2019/4/15
 */

const client = require('../PG-promise');

/**
 * @param item - transaction obj
 * @param calcObj {Object<account: count>} - store transaction count by account
 * */
function calcCount(item, calcObj){
    if (item.from) {
        if (!calcObj.hasOwnProperty(item.from)) {
            calcObj[item.from] = 0
        }
    }
    if (item.to) {
        if (!calcObj.hasOwnProperty(item.to)) {
            calcObj[item.to] = 0
        }
    }
    if (item.from === item.to) {
        calcObj[item.from] += 1
        return
    }
    if (item.from) {
        calcObj[item.from] += 1
    }
    if (item.to) {
        calcObj[item.to] += 1
    }
}

function updateCount(accounts) {
    return new Promise((resolve, reject) => {
        let query = {
            text: 'UPDATE accounts SET transaction_count = transaction_count + 1 WHERE account = ANY ($1::text[])',
            values: [accounts]
        };
        client.query(query, (err, res) => {
            if (err) {
                reject(err)
            } else {
                resolve(res)
            }
        })
    })
}

module.exports = {
    updateCount,
    calcCount,
}