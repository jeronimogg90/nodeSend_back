const Enlaces = require('../models/Enlace')
const shortid = require('shortid')
const bcrypt = require('bcrypt')
const { validationResult } = require('express-validator')

exports.nuevoEnlace = async (req, res, next) => {
    // Revisar si hay errores
    const errores = validationResult(req)
    if(!errores.isEmpty()){
        return res.status(400).json({errores: errores.array()})
    }

    //Crear un objeto de Enlace
    const { nombre_original, nombre } = req.body

    const enlace = new Enlaces()
    enlace.url = shortid.generate()
    enlace.nombre = nombre
    enlace.nombre_original = nombre_original

    // Si el usuario esta autenticado
    if(req.usuario){
        const { password, descargas } = req.body

        // Asignar a enlace el numero de descargas
        if(descargas){
            enlace.descargas = descargas
        }

        // Asignar un password
        if(password){
            const salt = await bcrypt.genSalt(10)
            enlace.password = await bcrypt.hash(password, salt)
        }

        // Asignar el autor
        enlace.autor = req.usuario.id
    }

    // Almacenar en la BD
    try{
        await enlace.save()
        res.json({msg: `${enlace.url}`})
        return next()
    } catch(error){
        return res.status(400).json({errores: "Error al generar el enlace"})
    }
}

// Obtiene un listado de todos los enlaces
exports.todosEnlaces = async (req, res) => {
    try{
        const enlaces = await Enlaces.find({}).select('url -_id')
        res.json({enlaces})
    } catch (error){
        console.log(error)
    }
}

// Retorna si el enlace tiene password o no
exports.tienePassword = async (req, res, next) => {
    // Verificar si existe el nelace
    const enlace = await Enlaces.findOne({url : req.params.url});
    
    if(!enlace){
        res.status(404).json({msg: 'El enlace no existe'})
        return next()
    }

    if(enlace.password){
        return res.json({ password: true, enlace: enlace.url, archivo: enlace.nombre})
    }

    next()
}

//Obtener el enlace
exports.obtenerEnlace = async (req, res, next) => {
    // Verificar si existe el nelace
    const enlace = await Enlaces.findOne({url : req.params.url});

    if(!enlace){
        res.status(404).json({msg: 'El enlace no existe'})
        return next()
    }

    // si el enalce existe
    const { nombre } = enlace

    res.json({archivo: nombre, password: false})

    next();
}

// Verificar Password al descargar archivo 
exports.verificarPassword = async (req, res, next) => {
    const { url } = req.params

    // Consulta el enalce
    const enlace = await Enlaces.findOne({ url });

    const { password } = req.body

    // Verificar password
    if(bcrypt.compareSync( password, enlace.password )){
        // Permitirle al usuario descargar el archvio
        next()
    }else{
        return res.status(401).json({msg: 'Password incorrecto'})
    }
}