const AppError = require("../utils/appError");
const User = require("../models/userModel");
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');
const multer = require("multer");

const multerStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/img/users');
    },
    filename: (req, file, cb) => {
        const ext = file.mimetype.split('/')[1];
        cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
    }
})

const multerFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image')) {
        cb(null, true);
    } else {
        cb(new AppError('Not an image!', 400), false);
    }
}

const upload= multer({
   storage: multerStorage,
   fileFilter: multerFilter
})

const filterObj = (obj, ...alowedFields) => {
    const newObj = {};
    Object.keys(obj).forEach(elem => {
        if (alowedFields.includes(elem)) {
            newObj[elem] = obj[elem];
        }
    })
    return newObj;
}

exports.getAllUsers = catchAsync(async (req, res, next) => {
    const users = await User.find();

    res.status(200).json({
        status: "success",
        results: users.length,
        data: {
            users
        }
    });
});

exports.getMe = (req, res, next) => {
    req.params.id = req.user.id;
    next();
}

exports.updateMe = catchAsync(async (req, res, next) => {
    console.log(req.file);
    console.log(req.body);

    // 1) create error if user trysto change Password via this route
    if (req.body.password || req.body.passwordConfirm) {
        return next(new AppError("You can't change passworf via this route, please use /updateMyPassword", 400));
    }

    // 2) Update user document
    const filteredObject = filterObj(req.body, "name", "email");

    if (req.file) {
        filteredObject.photo = req.file.filename;
    }

    const user = await User.findByIdAndUpdate(req.user.id, filteredObject, {
        new: true,
        runValidators: true
    });

    res.status(200).json({
        status: "success",
        user: user
    })
});

exports.deleteMe = catchAsync(async (req, res, next) => {
    const updatedUser = await User.findByIdAndUpdate(req.user.id, {
        active: false
    });

    res.status(200).json({
        status: "success",
        data: null
    })
})

exports.getUser = factory.getOne(User);

exports.uploadPhoto = upload.single('photo');