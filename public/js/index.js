/* eslint-disable */
import '@babel/polyfill';
import { login, logout } from './login';
import { displayMap } from './mapbox';
import { updateData } from './updateSettings';
import { bookTour } from './stripe';

const mapEl = document.getElementById('map');
if (mapEl) {
  const locations = JSON.parse(mapEl.dataset.locations);
  displayMap(locations);
}

const loginFormEl = document.getElementById('login-form');
if (loginFormEl) {
  loginFormEl.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    login(email, password);
  });
}

const updateAccountForm = document.querySelector('.form-user-data');
if (updateAccountForm) {
  updateAccountForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const name = document.getElementById('name').value;
    const photo = document.getElementById('photo').files[0];

    const formData = new FormData();
    formData.append('name', name);
    formData.append('email', email);
    formData.append('photo', photo);

    updateData(formData, 'data')
  });
}

const updatePasswordForm = document.querySelector('.form-user-settings');
if (updatePasswordForm) {
  updatePasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const passwordCurrent = document.getElementById('password-current').value;
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('password-confirm').value;

    await updateData({ password, passwordCurrent, passwordConfirm }, 'password')
    passwordCurrent.value = '';
    password.value = '';
    passwordConfirm.value = '';
  });
}

const logoutButton = document.querySelector('.nav__el--logout');
if (logoutButton) {
  logoutButton.addEventListener('click', () => {
    logout();
  });
}

const checkoutButton = document.getElementById('book-tour');
if (checkoutButton) {
  checkoutButton.addEventListener('click', (e) => {
    // from data in html
    const tourId = e.target.dataset.tourId;
    e.target.textContent = 'Processing...';
    bookTour(tourId);
  })
}