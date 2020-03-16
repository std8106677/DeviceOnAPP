import axios from 'axios';
//取消请求
let CancelToken = axios.CancelToken
axios.create({
    baseURL: 'https://cf-ccm-dev.ushop-plus.com',
    timeout: 50000,
    headers: {
        'Content-Type': 'application/json'
    }
});

axios.defaults.baseURL = 'https://cf-ccm-dev.ushop-plus.com';
axios.defaults.headers = {
    'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
};
// axios.defaults.headers['Content-Type'] = 'application/x-www-form-urlencoded;charset=UTF-8';
axios.defaults.timeout = 50000;
if (API_URL) {
    axios.defaults.baseURL = API_URL;
}
// //开始请求设置，发起拦截处理
// axios.interceptors.request.use(config => {
//     //得到参数中的requestname字段，用于决定下次发起请求，取消相应的  相同字段的请求
//     //post和get请求方式的不同，使用三木运算处理

//     return config;
// }, error => {
//     return Promise.reject(error)
// })
// respone攔截器
axios.interceptors.response.use(
    response => {
        const res = response.data;
        //這裡根據api回傳判斷
        if (res.status == 0 && res.error_code == 403) {
            window.location = '/';
        } else if (res.status == 1) {} else {
            // console.log(res);
        }
        return response;
    },
    error => {
        return Promise.reject(error)
    }
)

export default axios;
