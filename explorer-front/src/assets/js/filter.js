import Tools from '../../tools'
let czr = new Tools();

//做千分符
function numFormat(num) {
    var c = (num.toString().indexOf('.') !== -1) ? num.toLocaleString() : num.toString().replace(/(\d)(?=(?:\d{3})+$)/g, '$1,');
    return c;
}

/**
 * 接收: wei为单位的金额
 * 返回：czr为单位的金额
 *  */
export const toCZRVal = value => {
    if (value) {
        let tempVal = czr.utils.fromWei(value, "czr");
        return numFormat(tempVal);
    } else {
        return 0;
    }
}

/**
 * 
 * @param {total} val 单位Wei
 * @param {d} val 小数点位数
 */
export const toTokenVal = (value, precision) => {
    precision = Number(precision) || 18;
    if (value) {
        let tempVal = czr.utils.fromWeiToken(value, precision);
        return numFormat(tempVal);
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
        " / " +
        addZero(newDate.getMonth() + 1) +
        " / " +
        addZero(newDate.getDate()) +
        " " +
        addZero(newDate.getHours()) +
        ":" +
        addZero(newDate.getMinutes()) +
        ":" +
        addZero(newDate.getSeconds())
    );
}
