const express = require('express');
const router = express.Router({mergeParams: true});

const reviewController = require('./../controllers/reviewController');
const authController = require('../controllers/authController');

router.use(authController.protect);

router
  .route('/')
  .get(reviewController.getAllReviews)
  .post(authController.restrictTo('user'), reviewController.setTourUserId, reviewController.createReview);

  router
  .route('/:id')
  .get(reviewController.getReview)
  .patch(reviewController.updateReview)
  .delete(        
        reviewController.deleteReview
    )


module.exports = router;