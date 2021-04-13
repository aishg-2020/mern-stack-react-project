const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken');
const User = require('../../models/User');
const config = require('config')
// @route   POST api/users
// @desc    Register user
// @acess   Public
router.post('/', [
    check('name', 'Name is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Please enter a password with 6 or more chars').isLength({ min: 6 })
], async (req, res) => {

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ erros: errors.array() });
    }

    const { name, email, password } = req.body;

    try {

        let user = await User.findOne({
            email: email
        })

        // See if user exists
        if (user) {
            return res.status(400).json({ errors: [{ msg: 'User Already exists' }] });
        }

        // Get users gravator
        const avatar = gravatar.url(email, {
            s: '200',
            r: 'pg',
            d: 'mm'
        })

        user = new User({
            name, email, avatar, password
        })

        // Encrypt password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        await user.save();


        const payload = {
            user: {
                id: user.id // mongoose abstraction, we can use id instead of _id 
            }
        }

        // Return jsonwebtoken
        jwt.sign(
            payload,
            config.get('jwtSecret'),
            { expiresIn: 36000 },
            (err, token) => {
                if (err) throw err;
                res.json({ token })
            })

    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }


    console.log(req.body)



});

module.exports = router;