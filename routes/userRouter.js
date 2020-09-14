const express = require('express');
const router = express.Router();


const authController =  require('../controllers/authController');
const userController =  require('../controllers/userController');

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);

// protect below routes
router.use(authController.protect);

router.get('/getAll', userController.getAllUsers);
router.get('/getMe', userController.getMe, userController.getUser); 


router.patch('/updateMyPassword', authController.protect, authController.updatePassword);
router.patch('/updateMe',  userController.uploadPhoto, userController.updateMe);
router.delete('/deleteMe', authController.protect, userController.deleteMe);

module.exports = router;