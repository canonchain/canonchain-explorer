import axios from 'axios'
const api = {
    async get(url, data) {
        try {
            let res = await axios.get(url, { params: data })
            res = res.data
            return new Promise((resolve) => {
                if (res.code === 200) {
                    resolve(res)
                } else {
                    resolve(res)
                }
            })
        } catch (err) {
            console.log(err)
        }
    }
}
export { api }