const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const User = require('../../models/User');
const jwt = require('jsonwebtoken');
const config = require('config')
const bcrypt = require('bcryptjs');
const { check, validationResult } = require('express-validator');
// @route   GET api/auth
// @desc    Test route
// @acess   Public
router.get('/', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route       POST api/auth 
// @desc        Authenticate user & get token
// @access      Public

router.post('/', [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Please is rquired').exists()
], async (req, res) => {

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ erros: errors.array() });
    }

    const { email, password } = req.body;

    try {

        let user = await User.findOne({
            email: email
        })

        // See if user does not exists
        if (!user) {
            return res.status(400).json({ errors: [{ msg: 'Invalid credentials' }] });
        }


        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({ errors: [{ msg: 'Invalid credentials' }] });

        }
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