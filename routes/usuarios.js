const express = require('express')
const router = express.Router()
const usuarioController = require('../controllers/usuarioController')
const { check } = require('express-validator')

router.post('/',
    [
        check('nombre','El nombre es obligatorio').not().isEmpty(),
        check('email', 'Introduce un email valido').isEmail(),
        check('password', 'Introduce un password de al menos 6 caracteres').isLength({min: 6})
    ],
    usuarioController.nuevoUsuario
);

module.exports = router;