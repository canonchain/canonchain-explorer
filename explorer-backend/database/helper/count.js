/**
 * @author fangke
 * 2019/3/22
 */

const log4js = require('../log_config');
const logger = log4js.getLogger('write_db');//此处使用category的值

const client = require('../PG').client;

const countHelper = {
    accountsCount: 0,
    transactionCount: 0,
    transactionShown: 0,
};

/**
 * @param countKey - key in countHelper ['accountsCount', 'transactionCount']
 * @param globalKey - key of count store in global table
 * @returns {Promise} Promise object
 * */
async function getCount(countKey, globalKey) {
    let query, res;
    try {
        query = {
            text: 'SELECT value FROM global WHERE key = $1',
            values: [globalKey]
        };
        res = await client.query(query)
    } catch (e) {
        logger.error(query, e.stack)
    }
    if (res.rows.length === 0) {
        try {
            query = {
                text: 'INSERT INTO global (key, value) VALUES ($1, $2)',
                values: [globalKey, 0]
            };
            res = await client.query(query)
        } catch (e) {
            logger.error(query, e.stack)
        }
        countHelper[countKey] = 0
        return
    }
    countHelper[countKey] = +res.rows[0].count;
}

async function updateCount(countKey, globalKey, num) {
    let query;
    countHelper[countKey] += num;
    try {
        query = {
            text: 'UPDATE global SET value = $1 WHERE key = $2',
            values: [countHelper[countKey], globalKey]
        };
        await client.query(query)
    } catch (e) {
        logger.error(query, e.stack)
        throw e
    }
}

module.exports = {
    getCount,
    updateCount,
};
