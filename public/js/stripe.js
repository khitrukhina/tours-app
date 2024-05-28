/* eslint-disable */
import axios from 'axios';
import { showAlert } from './alert';

const stripe = Stripe('pk_test_51PKiTOC8wrv8Hf5U5DF0yrSvR9UuOzQV385ZdugPbCbF7ddGjRg9mjrTCJhVLtRLr4CDRNJH9E9sJKAncZ8d9Lcg00Qr6pdAXe');

export const bookTour = async (tourId) => {
  try {
    //  get checkout session id from api
    const res = await axios({
      method: 'GET',
      url: `http://127.0.0.1:3000/api/v1/booking/checkout-session/${tourId}`,
    });
    const session = res.data.session;

    // create checkout form
    await stripe.redirectToCheckout({
      sessionId: session.id,
    });
  } catch (e) {
    showAlert('error', e);
  }
}