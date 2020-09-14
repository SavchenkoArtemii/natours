const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const sendMail = require('../utils/email');
const crypto = require('crypto');

const signToken = id => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    });
};

const createSendToken = (user, statusCode, res) => {
    const token = signToken(user._id);
    const cookieOptions = {
        expires: new Date(
            Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
        ),
        httpOnly: true
    };
    if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

    res.cookie('jwt', token, cookieOptions);

    // Remove password from output
    user.password = undefined;

    res.status(statusCode).json({
        status: 'success',
        token,
        data: {
            user
        }
    });
};

exports.signup = catchAsync(async (req, res, next) => {
    const newUser = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        passwordConfirm: req.body.passwordConfirm,
        passwordChangedAt: req.body.passwordChangedAt,
        userRole: req.body.userRole
    });

    // 3) If everything ok, send token to client
    createSendToken(newUser, 200, res);
});

exports.login = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return next(new AppError("Please provide email and password!", 400));
    }

    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.correctPasswords(password, user.password))) {
        return next(new AppError("Incorrect email or password!", 401));
    }

    // 3) If everything ok, send token to client
    createSendToken(user, 200, res);
});

exports.protect = catchAsync(async (req, res, next) => {

    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }
    console.log(`TOKEN: ${token}`);
    if (!token) {
        return next(new AppError("You are not logged in", 401));
    }
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET)

    // check if user still exists
    const freshUser = await User.findById(decoded.id);
    if (!freshUser) {
        return next(new AppError("The token is out of date", 401));
    }

    //check if user changed password after login
    if (freshUser.changePasswordAfter(decoded.iat)) {
        return next(new AppError("User recently changed password. Please log in again!", 401));
    }


    // grant access to a protected route
    req.user = freshUser;
    next();
})

exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return next(new AppError("You don't have permissions to perform this action", 403));
        }
        next();
    }
}

exports.forgotPassword = catchAsync(
    async (req, res, next) => {
        // 1 get user by email
        const user = await User.findOne({ email: req.body.email });
        if (!user) {
            return next(new AppError("There is no user with email adress", 404));
        }

        // 2 generate random reset token
        const resetToken = user.createPasswordResetToken();
        await user.save({ validateBeforeSave: false });

        // 3 send it to the user's email
        const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;
        console.log(resetURL);

        const message = `Forgot your password? Please send PATCH request with your new password 
        and passwordConfirm to: ${resetURL} `;

        try {
            await sendMail({
                email: user.email,
                subject: 'Your password reset token (valid for 10 min)',
                message: message
            });

            res.status(200).json({
                status: 'success',
                message: 'Token sent to users email'
            })
        } catch (err) {

            console.log(err);

            user.passwordResetToken = undefined;
            user.passwordResetExpires = undefined;
            await user.save({ validateBeforeSave: false });

            return next(new AppError('There was an error trying send email. Try again later!', 500))
        }


    }
)

exports.resetPassword = catchAsync(async (req, res, next) => {
    // 1) Get user based on the token
    const hashedToken = crypto
        .createHash('sha256')
        .update(req.params.token)
        .digest('hex');

    const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() }
    });

    // 2) If token has not expired, and there is user, set the new password
    if (!user) {
        return next(new AppError('Token is invalid or has expired', 400));
    }
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
    // 3) Update changedPasswordAt property for the user
    // 4) Log the user in, send JWT
    createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
    // 1) Get user 

    const user = await User.findById(req.user.id).select('+password');
    if (!user) {
        return next(new AppError('Token is invalid or has expired', 400));
    }
    // 2) Check current user's password
    if (! await user.correctPasswords(req.body.currentPassword, user.password)) {
        return next(new AppError("Your current password doesn't match users password", 401));
    }
    // 3) Change password
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    await user.save();
    // 4) Log user in with new password, send JWT
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    });



    res.status(200).json({
        status: 'success',
        token
    })
})