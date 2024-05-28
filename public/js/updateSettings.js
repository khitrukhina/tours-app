/* eslint-disable */
import { showAlert } from './alert';
import axios from 'axios';

//type password or data
export const updateData = async (data, type) => {
  try {
    const res = await axios({
      method: 'PATCH',
      url: `http://127.0.0.1:3000/api/v1/users/${type === 'data' ? 'update-current' : 'update-password'}`,
      data,
    }).then(() => {
      showAlert('success', `Successfully updated`);
      window.setTimeout(() => {
        location.reload();
      }, 1500);
    })
  } catch (e) {
    showAlert('error', e.response.data.message);
  }
};
