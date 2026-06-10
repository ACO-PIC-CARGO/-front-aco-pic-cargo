import axios from 'axios';

axios.interceptors.request.use(config => {
  const userData = JSON.parse(sessionStorage.getItem("dataUser"));

  if (userData && userData[0]) {
    config.headers['X-User-ID'] = userData[0].users;
  }

  return config;
});

export default axios;