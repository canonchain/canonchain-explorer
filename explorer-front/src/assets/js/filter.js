import Tools from '../../tools'
import BigNumber from 'bignumber.js'

let czr = new Tools();

//做千分符
function handlerFormat(num) {
    return num.toString().replace(/(\d)(?=(?:\d{3})+$)/g, '$1,');
}
function numFormat(num, fixedVal) {
    if (fixedVal) {
        num = new BigNumber(num).toFixed(fixedVal)
        // let reg = /(\d+(?:\.)?)(\d{0,4})/;
        // let regAry = reg.exec(num);
        // let integer = regAry[1];
        // let decimal = regAry[2];
        // while (decimal.length < Number(fixedVal)) {
        //     decimal += "0";
        // }
        // num = integer + decimal;
    }
    let floatIndex = num.toString().indexOf('.');
    let result;
    if (floatIndex !== -1) {
        //小数
        let tempAry = num.toString().split(".");
        result = `${handlerFormat(tempAry[0])}.${tempAry[1]}`
    } else {
        //整数
        result = handlerFormat(num);
    }
    return result;
}

/**
 * 接收: 10*10-18次方为单位的金额
 * 返回：czr为单位的金额
 *  */
export const toCZRVal = value => {
    if (value) {
        let tempVal = czr.utils.fromKing(value, "czr");
        return numFormat(tempVal);
    } else {
        return 0;
    }
}

/**
 * 接收: 10*10-18次方为单位的金额
 * 返回：czr为单位的金额,保留4位小数
 *  */
export const toCZRShort = value => {
    if (value) {
        let tempVal = czr.utils.fromKing(value, "czr");
        return numFormat(tempVal, 4);
    } else {
        return 0;
    }
}

/**
 * 
 * @param {total} val 单位10*10-18次方 
 * @param {d} val 小数点位数
 */
export const toTokenVal = (value, precision) => {
    precision = Number(precision) || '1000000000000000000';
    if (value) {
        let tempVal = czr.utils.fromKingToken(value, precision);
        return numFormat(tempVal);
    } else {
        return 0;
    }
}

export const toTokenShort = (value, precision) => {
    precision = Number(precision) || '1000000000000000000';
    if (value) {
        let tempVal = czr.utils.fromKingToken(value, precision);
        return numFormat(tempVal, 4);
    } else {
        return 0;
    }
}

/**
 * 接收: 秒为单位的时间戳
 * 返回："2019 / 04 / 19 16:13:12"
 *  */
export const toDate = val => {
    if (val == "0" || !val) {
        return "-";
    }
    let newDate = new Date();
    newDate.setTime(val * 1000);
    let addZero = function (val) {
        return val < 10 ? "0" + val : val;
    };
    return (
        newDate.getFullYear() +
        "/" +
        addZero(newDate.getMonth() + 1) +
        "/" +
        addZero(newDate.getDate()) +
        " " +
        addZero(newDate.getHours()) +
        ":" +
        addZero(newDate.getMinutes()) +
        ":" +
        addZero(newDate.getSeconds())
    );
}
