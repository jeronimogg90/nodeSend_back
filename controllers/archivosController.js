// Subida de archivos
const multer = require('multer')
const shortid = require('shortid')
const fs = require('fs')
const Enlaces = require('../models/Enlace')

exports.subirArchivo = async (req, res, next) => {
    const configuracionMulter = {
        limits: { fileSize: req.usuario ? 1024 * 1024 * 10 : 1024 * 1024 },
        storage: fileStorage = multer.diskStorage({
            destination: (req, file, cb) => {
                cb(null, __dirname+'/../uploads')
            },
            filename: (req, file, cb) => {
                const extension = file.originalname.substring(file.originalname.lastIndexOf('.'), file.originalname.length)
                cb(null, `${shortid.generate()}${extension}`)
            },
            fileFiler: (req, file, cb) => {
                if(file.mimetype === 'application/pdf'){ // no aceptamos pdf
                    return cb(null, true);
                }
            }
        })
    }
    
    const upload = multer(configuracionMulter).single('archivo');

    upload( req, res, async (error) => {

        if(!error){
            res.json({archivo: req.file.filename})
        }else{
            res.status(403).json({error: "Hubo un error"})
            return next()
        }
    });

};


exports.eliminarArchivo = async (req, res) => {
    try{
        fs.unlinkSync(__dirname + `/../uploads/${req.archivo}`)
        console.log("archivo eliminado")
    } catch(error){
        console.log(error)
        res.status(400).json({error: "Hubo un error borrando el fichero"})
    }
};

// Descarga un archivo
exports.descargar = async (req, res, next) => {

    // Obtiene el enlace
    const {archivo} = req.params
    const enlace = await Enlaces.findOne({nombre: archivo})

    const archivoDescarga = __dirname + '/../uploads/' + archivo
    res.download(archivoDescarga)
    console.log(enlace)
    // Eliminar el archivo ty la entrada en BD
    // Si las descargas son iguales a 1 - Borrar la entrada y borrar el archivo
    const {descargas, nombre} = enlace

    if(descargas === 1){

        // Eliminar el archivo
        req.archivo = nombre

        // Eliminar la entrada en base de datos
        await Enlaces.findOneAndRemove(enlace.id);
        
        // Con next pasa al siguiente controlador
        next()

    } else {
        // Si las descargas son > a 1 - Restar 1
        enlace.descargas--
        await enlace.save()
    }
}
