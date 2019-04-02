
const express = require('express');

const body_parser = require('express');

const mysql = require('mysql');

const nodemailer = require('nodemailer');

const bcrypt = require('bcrypt');

const africastalking = require('africastalking');


const ip = require('ip');

const validator = require('validator');

const helpers = require('./helpers');


const app = express();

const conn = mysql.createConnection({host:"localhost", user:"root", password:"", database:"mygas"});


//check if user phonenumber exists
app.get('/checkphonenumber', (req, res)=>{

    if(req.query.phonenumber === undefined){



        helpers.showtext(res, "please input a phonenumber");

    }else {

        if(validator.isMobilePhone(req.query.phonenumber)){

            conn.connect((err)=>{

                if(err)
                    helpers.showerror(res, err.message); ;


                    let phonenumber = req.query.phonenumber;

                    conn.query("SELECT phone_number FROM user WHERE phone_number = '"+ phonenumber +"'", (err, result, fields)=>{


                        if(err)

                            helpers.showerror(res, err.message);


                        if(result.length > 0) {

                            helpers.showtext("ok");


                        }else{

                            helpers.showtext(res, 'phonenumber doesnt exist');
                        }

                    // helpers.showjson(res, result);


                    });




            });



           // helpers.showjson(res, req.query);


        }else{


            helpers.showtext(res, "please input a valid phonenumber");

        }



    }



});

app.get('/saveuser', (req,res)=>{

    if(req.query.name === undefined || req.query.email === undefined || req.query.city === undefined || req.query.country === undefined || req.query.phonenumber === undefined ){

        helpers.showtext(res, "Please input all the required values");


    }else{

        if(validator.isEmail(req.query.email)){

            let username = req.query.name;
            let city = req.query.city;
            let country= req.query.country;
            let phonenumber = req.query.phonenumber;
            let  email = req.query.email;
            let ipaddress = ip.address();

            conn.connect((err)=>{

                if(err)
                    helpers.showerror(res, err.message);

                conn.query("INSERT INTO user (username, city, country, phone_number, email, ip_address, datetime) VALUES ('"+ username + "', '" + city + "', '" + country +"', '"+ phonenumber +"', '" + email + "', '" + ipaddress + "', NOW() )" ,(err,result,fields)=>{
                    if(err)
                        helpers.showerror(res, err.message);

                    helpers.showtext(res, 'saved successfully');



                });


            });


        }else{


            helpers.showtext(res, "Please input a valid email address");

        }

    }




    });

app.listen(3000);

