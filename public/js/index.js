/* eslint-disable */
import '@babel/polyfill';
import { displayMap } from './leaflet';
import { login, logout } from './login';
import { bookTour } from './stripe';
import { updateAccountSettings } from './updateSettings';

// DOM ELEMENTS
const mapBox = document.getElementById('map');
const loginForm = document.querySelector('.form--login');
const logoutBtn = document.querySelector('.nav__el--logout');
const settingsForm = document.querySelector('.form-user-data');
const updatePasswordForm = document.querySelector('.form-user-password');
const updatePasswordBtn = document.querySelector('.btn--save-password');
const bookTourBtn = document.getElementById('book-tour');

// VALUES

// DELEGATION
if (mapBox) {
  const locations = JSON.parse(mapBox.dataset.locations);
  displayMap(locations);
}

if (loginForm) {
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    login(email, password);
  });
}

if (logoutBtn) {
  logoutBtn.addEventListener('click', logout);
}

if (settingsForm) {
  settingsForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const form = new FormData();
    form.append('name', name);
    form.append('email', email);
    form.append('photo', document.getElementById('photo').files[0]);
    console.log(form);

    updateAccountSettings(form, 'general');
  });
}

if (updatePasswordForm) {
  updatePasswordForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (updatePasswordBtn) updatePasswordBtn.innerHTML = 'Updating...';
    const currentPassword = document.getElementById('password-current');
    const newPassword = document.getElementById('password');
    const passwordConfirm = document.getElementById('password-confirm');
    updateAccountSettings(
      {
        currentPassword: currentPassword.value,
        newPassword: newPassword.value,
        passwordConfirm: passwordConfirm.value,
      },
      'password'
    )
      .then(() => {
        currentPassword.value = '';
        newPassword.value = '';
        passwordConfirm.value = '';
      })
      .finally(() => {
        if (updatePasswordBtn) updatePasswordBtn.innerHTML = 'Save password';
      });
  });
}

if (bookTourBtn) {
  bookTourBtn.addEventListener('click', async (e) => {
    e.target.innerHTML = 'Processing';
    const { tourId } = e.target.dataset;
    await bookTour(tourId);
    e.target.innerHTML = 'Book tour now!';
  });
}
