const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const tourController = require('./../controllers/tourController');
const reviewRouter = require('./../routes/reviewRouter');

router.use('/:tourId/reviews', reviewRouter);

router
  .route('/')
  .get(authController.protect, tourController.getAllTours)
  .post(tourController.createTour);

router
  .route('/:id')
  .get(tourController.getTour)
  .patch(tourController.updateTour)
  .delete(
        authController.protect,
        authController.restrictTo('admin', 'lead-guide'),
        tourController.deleteTour
    )

router.route(
  '/tours-within/:distance/center/:latlng/unit/:unit'  
).
get(tourController.getTourWithin);

module.exports = router;


