'use strict';

const helpers = require('./helpers');
require('dotenv').config();

const express = require('express');
const multer = require('multer');
const path = require('path');
const vision = require('@google-cloud/vision');
const mongodb = require('mongodb');
const bodyParser = require('body-parser');

//dependencies for Microsoft CV
const async = require('async');
const fs = require('fs');
const createReadStream = require('fs').createReadStream
const sleep = require('util').promisify(setTimeout);

//Express and Socket.io
const app = new express();
var server = require('http').Server(app);
var io = require('socket.io')(server);

//The connection line for mongodb
const uri = process.env.URI;
const dbName = process.env.dbName;
const collectionName = process.env.collectionName;

// Create a client for Cloud Vision
const client = new vision.ImageAnnotatorClient();

//encapsulate the application in a async function
//so we can use await for db connection only once 
(async function() {
  var clientDb, db, colors;
  async function connectDatabase() {
    clientDb = await mongodb.MongoClient.connect(uri, { 
      useNewUrlParser: true, 
      useUnifiedTopology: true
    });
    db = clientDb.db(dbName);
    colors = db.collection(collectionName);
  }
  await connectDatabase();

  const port = process.env.PORT || 80;
  app.use(express.static(__dirname + '/public'));
  app.use('/imgs', express.static(__dirname + '/imgs'));
  app.use(bodyParser.urlencoded({ extended: true }));

  //
  //    /$$  
  //  /$$$$  
  // |_  $$  
  //   | $$  
  //   | $$  
  //   | $$  
  //  /$$$$$$
  // |______/
  // when a user conncect, we return all data to create the sea
  io.on('connection', async function(socket){
    console.log('a user connected');
    
    //send back all data
    var result = await colors.find().sort({ "_id": -1 }).limit(400).toArray();
    socket.emit('all', result);
  });

  const storage = multer.diskStorage({
      destination: function(req, file, cb) {
          cb(null, 'imgs');
      },

      // By default, multer removes file extensions so let's add them back
      filename: function(req, file, cb) {
          cb(null, Date.now() + path.extname(file.originalname));
      }
  });

  //   /$$$$$$ 
  //  /$$__  $$
  // |__/  \ $$
  //   /$$$$$$/
  //  /$$____/ 
  // | $$      
  // | $$$$$$$$
  // |________/
  // when a user upload an image with the first color selected
  app.post('/upload-profile-pic', (req, res) => {
      // 'profile_pic' is the name of our file input field in the HTML form
      let upload = multer({ storage: storage, fileFilter: helpers.imageFilter }).single('profile_pic');

      upload(req, res, function(err) {
          // req.file contains information of uploaded file
          // req.body contains information of text fields, if there were any
          res.setHeader('Content-Type', 'application/json');
          if (req.fileValidationError) {
              return res.end(JSON.stringify({status:false, message:req.fileValidationError}));
          }
          else if (!req.file) {
              return res.end(JSON.stringify({status:false, message:'Please select an image to upload'}));
          }
          else if (err instanceof multer.MulterError) {
              return res.end(JSON.stringify({status:false, message:err}));
          }
          else if (err) {
              return res.end(JSON.stringify({status:false, message:err}));
          }

          //the client that sends the image data to the mongodb
          client
          .imageProperties(req.file.path)
          .then(results => {
            const result = results[0].imagePropertiesAnnotation.dominantColors.colors;
            //console.log(`Label Annotations Result: ${JSON.stringify(result, null, 2)}`);

            //data to insert in database
            var myobj = {
              uuid: Math.floor(Date.now() + Math.random()),
              gdata: JSON.stringify(result),
              colorchosen1: req.body.colorchosen1,
              colorchosen2: req.body.colorchosen2,
              filePath: "null"
              //filePath value is the same string for every upload, so we don't save file names anymore! :)
            };
            //console.log(myobj);

            //sendToMongo
            try {
              var insertResult = colors.insertOne(myobj, function(err, result) {
                if(err) throw err;
              });
            } catch (error){
              console.log(error);
            }

            // return successful response data
            res.end(JSON.stringify({
              status: true,
              message: 'Success',
              uuid: myobj.uuid,
              url: req.file.path,
              cvColors: result
            }));

          })
          .catch(err => {
            console.error('ERROR:', err);
          });
      });
  });

  //   /$$$$$$ 
  //  /$$__  $$
  // |__/  \ $$
  //    /$$$$$/
  //   |___  $$
  //  /$$  \ $$
  // |  $$$$$$/
  //  \______/ 
  // when a user confirm the second color from the uploaded image
  app.post('/color2', express.json({type: '*/*'}), async (req, res) => {
    let uuid = req.body.uuid;
    let colorchosen2 = req.body.colorchosen2;
    res.setHeader('Content-Type', 'application/json');
    if (!uuid) {
        return res.end(JSON.stringify({status:false, message:"Please provide an uuid provided"}));
    }
    else if (!colorchosen2) {
        return res.end(JSON.stringify({status:false, message:'Please provide a colorchose2 parameter'}));
    }

    try {
      await colors.updateOne(
          { uuid: uuid }, 
          { "$set": { "colorchosen2": colorchosen2 } }
      );
    } catch (e) {
      console.log(e);
      res.end(JSON.stringify({
        status: false,
        message: e
      }));
      return;
    }

    res.end(JSON.stringify({
      status: true,
      message: 'Success'
    }));
  });

  //  /$$   /$$
  // | $$  | $$
  // | $$  | $$
  // | $$$$$$$$
  // |_____  $$
  //       | $$
  //       | $$
  //       |__/
  // when user confirm his selection
  // we notify all other users a new color has been added
  app.post('/send', express.json({type: '*/*'}), async (req, res) => {
    let uuid = req.body.uuid;
    let selectedColors = req.body.selectedColors;
    res.setHeader('Content-Type', 'application/json');
    if (!uuid) {
        return res.end(JSON.stringify({status:false, message:"Please provide an uuid provided"}));
    }
    else if (!selectedColors) {
        return res.end(JSON.stringify({status:false, message:'Please provide a selectedColors parameter'}));
    }

    console.log(selectedColors);
    io.sockets.emit('new', {uuid, selectedColors})

    res.end(JSON.stringify({
      status: true,
      message: 'Success'
    }));
  });


  server.listen(port, () => console.log(`Algorithmic Sea listening on port ${port}!`))

})();
