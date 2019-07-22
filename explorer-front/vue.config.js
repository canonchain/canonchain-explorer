const path = require('path');

function resolve(dir) {
    // console.log(path.join(__dirname, dir))
    return path.join(__dirname, dir);
}
module.exports = {
    lintOnSave: false,
    chainWebpack: (config) => {
        config.resolve.alias
            .set('@', resolve('src'))
            .set('@assets', resolve('src/assets'))
            .set('@/components', resolve('src/components'))
    },
    devServer: {
        proxy: {
            '/mapping': {
                target: 'http://localhost:8001',   //代理接口
                changeOrigin: true,
                pathRewrite: {
                    '^/mapping': '/mapping'    //代理的路径
                }
            },
            '/api': {
                target: 'http://localhost:8001',   //代理接口
                changeOrigin: true,
                pathRewrite: {
                    '^/api': '/api'    //代理的路径
                }
            }
        }
    }
};