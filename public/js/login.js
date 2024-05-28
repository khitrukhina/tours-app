/* eslint-disable */
import axios from 'axios';
import { showAlert } from './alert';

export const login = async (email, password) => {
  try {
    const res = await axios({
      method: 'POST',
      url: 'http://127.0.0.1:3000/api/v1/users/login',
      data: {
        email,
        password,
      }
    }).then(() => {
      showAlert('success', 'Successfully logged in');
      window.setTimeout(() => {
        location.assign('/');
      }, 1500);
    })
  } catch (e) {
    showAlert('error', e.response.data.message);
  }
};

export const logout =  async () => {
  try {
    const res = await axios({
      method: 'GET',
      url: 'http://127.0.0.1:3000/api/v1/users/logout'
    }).then(() => {
      // reload from server not a cache
      location.reload(true);
    });
  } catch (e) {
    showAlert('error', 'Error logging out');
  }
};


