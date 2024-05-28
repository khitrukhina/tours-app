const express = require('express');

const userController = require('../controllers/user-controller');
const authController = require('../controllers/auth-controller');

const router = express.Router();

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/logout', authController.logout);

router.patch('/reset-password/:token', authController.resetPassword);
router.post('/forgot-password', authController.forgotPassword);

// protect all routes below
router.use(authController.protectUnauth);

router.patch('/update-password', authController.updatePassword);
router.patch(
  '/update-current',
  userController.uploadUserPhoto,
  userController.updateCurrentUser,
);
router.delete('/delete-current', userController.deleteCurrentUser);

router.get('/me', userController.getCurrentUser, userController.getUser);

// allow to perform actions for admin only in all the routes below
router.use(authController.restrictTo('admin'));

router.route('/').get(userController.getAllUsers);

router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
