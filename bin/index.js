
const express = require('express');

const body_parser = require('express');

const mysql = require('mysql');

//const nodemailer = require('nodemailer');

//const bcrypt = require('bcrypt');

//const africastalking = require('africastalking');

const ip = require('ip');

const validator = require('validator');

const helpers = require('./helpers');

const request = require('request');

const baseeconcoder = require('base-64');

const timestamp = require('time-stamp');



const app = express();

const bodyparser_json = body_parser.json();

const url_encoder = body_parser.urlencoded({extended: true});



const conn = mysql.createConnection(
    {host:"localhost",
        user:"root",
        password:"",
        database:"mygas",
        dateStrings:true

    });




//check if user phonenumber exists
app.get('/checkphonenumber', (req, res)=>{

    if(req.query.phonenumber === undefined){



        helpers.showtext(res, "please input a phonenumber");

    }else {

        if(validator.isMobilePhone(req.query.phonenumber)){



                    let phonenumber = conn.escape(req.query.phonenumber);

                    conn.query("SELECT user.user_id, username, city, country, phone_number, email, sounds, location, notification FROM user INNER JOIN  settings ON user.user_id = settings.user_id WHERE phone_number = "+ phonenumber, (err, result, fields)=> {


                        if (err) {

                            helpers.showerror(res, err.message);

                        }else{

                        if (result.length > 0) {


                            helpers.showjson(res, result);


                        } else {

                            helpers.showtext(res, 'nonexistent');


                        }


                    }

                    });



        }else{


            helpers.showtext(res, "please input a valid phonenumber");

        }



    }



});

app.get('/saveuser', (req,res)=>{

    if(req.query.name === undefined || req.query.email === undefined || req.query.city === undefined || req.query.country === undefined || req.query.phonenumber === undefined ){

        helpers.showtext(res, "Please input all the required fields");


    }else{

        if(validator.isEmail(req.query.email)){

            let username = conn.escape(req.query.name);
            let city = conn.escape(req.query.city);
            let country= conn.escape(req.query.country);
            let phonenumber = conn.escape(req.query.phonenumber);
            let  email = conn.escape(req.query.email);
            let ipaddress = ip.address();



                //check if email address exists
                conn.query("SELECT email FROM user WHERE email = "+email, (err, result, fields)=> {

                    if (err) {
                        helpers.showerror(res, err.message);


                    } else {


                        if (result.length > 0) {

                            helpers.showtext(res, 'please choose another email-address');

                        } else {


                            //check if phonenumber exists
                            conn.query("SELECT phone_number FROM user WHERE phone_number = " + phonenumber, (err, result, fields) => {

                                if (err) {
                                    helpers.showerror(res, err.message);

                                } else {

                                    if (result.length > 0) {

                                        helpers.showtext(res, 'please choose another phonenumber');

                                    } else {


                                        conn.beginTransaction((err) => {

                                            if (err) {
                                                helpers.showerror(res, err.message);

                                            } else {


                                                conn.query("INSERT INTO user (username, city, country, phone_number, email, ip_address, datetime) VALUES (" + username + ", " + city + ", " + country + ", " + phonenumber + ", " + email + ", '" + ipaddress + "', NOW() )", (err, result, fields) => {

                                                    if (err) {

                                                        conn.rollback();

                                                        helpers.showerror(res, err.message);


                                                    } else {

                                                        if(result.affectedRows > 0){


                                                        conn.query("SELECT user_id FROM user ORDER BY datetime DESC ", (err, result, fields) => {

                                                            if (err) {

                                                                conn.rollback();
                                                                helpers.showerror(res, err.message);


                                                            } else {
                                                                // console.log(result)

                                                                let id = result[0].user_id;


                                                                conn.query("INSERT INTO settings (user_id, sounds, location, notification) VALUES ( " + id + ", 'YES', 'YES', 'YES' )", (err, result, fields) => {

                                                                    if (err) {

                                                                        conn.rollback();
                                                                        helpers.showerror(res, err.message);


                                                                    } else {

                                                                        if(result.affectedRows > 0){


                                                                        conn.commit((err) => {

                                                                            if (err) {

                                                                                conn.rollback();
                                                                                helpers.showerror(res, err.message);


                                                                            } else {


                                                                                conn.query("SELECT user.user_id, username, city, country, phone_number, email, sounds, location, notification  FROM user INNER JOIN settings ON user.user_id = settings.user_id WHERE phone_number = " + phonenumber, (err, result, fields) => {


                                                                                    if (err) {

                                                                                        helpers.showerror(res, err.message);

                                                                                    } else {

                                                                                        if (result.length > 0) {


                                                                                            helpers.showjson(res, result);


                                                                                        } else {

                                                                                            helpers.showtext(res, 'phonenumber doesnt exist');


                                                                                        }

                                                                                    }


                                                                                });

                                                                            }

                                                                        });

                                                                    }else{

                                                                            console.log("insert user settings to database failed");

                                                                            conn.rollback()
                                                                            helpers.showtext(res, "oops something went wrong");



                                                                        }

                                                                    }

                                                                });

                                                            }


                                                        });

                                                    }else{

                                                            console.log("insert users to database failed");

                                                        conn.rollback()
                                                        helpers.showtext(res, "oops something went wrong");


                                                        }

                                                    }

                                                });
                                            }
                                        });


                                    }

                                }


                            });

                        }


                    }


                });

        }else{


            helpers.showtext(res, "Please input a valid email address");

        }


    }




    });


   app.get("/getinventoryproducts",(req, res)=>{

       if(req.query.longitude === undefined || req.query.latitude === undefined ||req.query.country === undefined || req.query.city === undefined){


         helpers.showtext(res, "please input all the required fields")

       }else{


           let longitude = req.query.longitude;
           let latitude = req.query.latitude;
           let country = conn.escape(req.query.country);
           let city = conn.escape(req.query.city);



               conn.query("SELECT DISTINCT suppliers.supplier_id, ROUND(( 6371 * acos( cos( radians(" +latitude + ") ) * cos( radians(latitude ) ) * cos( radians(longitude ) - radians(" + longitude + ") ) + sin( radians(" + latitude + ") ) * sin( radians( latitude) ) ) ), 2) AS distance FROM inventory INNER JOIN suppliers ON suppliers.supplier_id = inventory.supplier_id WHERE country = "+ country + " AND city = "+ city + " AND ROUND(( 6371 * acos( cos( radians(" +latitude + ") ) * cos( radians(latitude ) ) * cos( radians(longitude ) - radians(" + longitude + ") ) + sin( radians(" + latitude + ") ) * sin( radians( latitude) ) ) ), 2)  < 10 ORDER BY distance ASC LIMIT 1", (err, result, fields)=> {

                   if (err) {
                       helpers.showerror(res, err.message);

                   }else{

                   if (result.length > 0) {

                       supplier_id = result[0].supplier_id;

                       conn.query("SELECT DISTINCT product_name, supplier_id FROM inventory WHERE supplier_id = " + supplier_id, (err, result, fields) => {

                           if (err) {
                               helpers.showerror(res, err.message);

                           }else {
                               helpers.showjson(res, result);

                           }

                       });


                   } else {


                       helpers.showtext(res, 'sorry no nearby gas suppliers were found near your area');

                   }

               }

               });


       }




   });


app.get("/getinventoryquantity",(req, res)=>{

    if(req.query.longitude === undefined || req.query.latitude === undefined ||req.query.country === undefined || req.query.city === undefined){


        helpers.showtext(res, "please input all the required fields")

    }else{


        let longitude = req.query.longitude;
        let latitude = req.query.latitude;
        let country = conn.escape(req.query.country);
        let city = conn.escape(req.query.city);



        conn.query("SELECT DISTINCT suppliers.supplier_id, ROUND(( 6371 * acos( cos( radians(" +latitude + ") ) * cos( radians(latitude ) ) * cos( radians(longitude ) - radians(" + longitude + ") ) + sin( radians(" + latitude + ") ) * sin( radians( latitude) ) ) ), 2) AS distance FROM inventory INNER JOIN suppliers ON suppliers.supplier_id = inventory.supplier_id WHERE country = "+ country + " AND city = "+ city + " AND ROUND(( 6371 * acos( cos( radians(" +latitude + ") ) * cos( radians(latitude ) ) * cos( radians(longitude ) - radians(" + longitude + ") ) + sin( radians(" + latitude + ") ) * sin( radians( latitude) ) ) ), 2)  < 10 ORDER BY distance ASC LIMIT 1", (err, result, fields)=> {

            if (err) {
                helpers.showerror(res, err.message);

            }else{

            if (result.length > 0) {

                supplier_id = result[0].supplier_id;

                conn.query("SELECT DISTINCT quantity, supplier_id FROM inventory WHERE supplier_id = " + supplier_id + " ORDER BY quantity DESC", (err, result, fields) => {

                    if (err) {
                        helpers.showerror(res, err.message);

                    }else {
                        helpers.showjson(res, result);

                    }

                });


            } else {


                helpers.showtext(res, 'sorry no nearby gas suppliers were found near your area');

            }


        }

        });



    }




});

app.post("/addtocart", url_encoder, (req, res)=>{

    if(req.body.productname === undefined  || req.body.quantity === undefined || req.body.userid === undefined  || req.body.operation === undefined  || req.body.city === undefined ){

        helpers.showtext(res, "please input all the fields");

    }else{

        let productname = req.body.productname;

        let quantity = req.body.quantity;

        let userid = req.body.userid;

        let operation = req.body.operation;

        let city = req.body.city;

        let cost;

        conn.query("SELECT refillcost, combinedcost FROM prices WHERE city = '"+city+"' AND quantity ="+quantity, (err, result, fields) => {
            if (err) {
                helpers.showerror(res, err.message);

            }else{

            if (result.length > 0) {

                if (operation == "refill") {

                    cost = result[0].refillcost

                } else {

                    cost = result[0].combinedcost

                }

                let itemdescription = quantity + " Kgs " + operation


                //check if any cart exists for the userid

                conn.query("SELECT cart_id FROM cart WHERE user_id = " + userid + " AND checkedout = 'NO'", (err, result, fields) => {

                    if (err) {
                        helpers.showerror(res, err.message);

                    }else{

                    //shopping cart exists add item and update subtotal
                    if (result.length > 0) {


                        let cartid = result[0].cart_id;

                        conn.beginTransaction((err) => {

                            if (err) {
                                helpers.showerror(res, err.message);

                            }else{

                            //save item
                            conn.query("INSERT INTO cartitems (cart_id, item_name, item_description, datetime, currency, cost) VALUES (" + cartid + ", '" + productname + "', '" + itemdescription + "', NOW(), 'KSH', " + cost + ")", (err, result, fields) => {

                                if (err) {
                                    conn.rollback();

                                    helpers.showerror(res, err.message);


                                }else{

                                //update total cost

                                conn.query("UPDATE cart SET sub_total = sub_total + " + cost + " WHERE cart_id = " + cartid, (err, result, fields) => {

                                    if (err) {

                                        conn.rollback();

                                        helpers.showerror(res, err.message);
                                    }else {

                                        if(result.affectedRows > 0 ){


                                        conn.commit((err) => {
                                            if (err) {

                                                conn.rollback();

                                                helpers.showerror(err.message);
                                            } else {

                                                conn.query("SELECT cart_id, item_name, item_description, cost, currency, datetime FROM cartitems WHERE cart_id = " + cartid, (err, result, fields) => {

                                                    if (err) {
                                                        helpers.showerror(res, err.message);

                                                    } else {

                                                        helpers.showjson(res, result);

                                                    }

                                                });

                                            }


                                        });

                                    }else{


                                            console.log("update cart total error");

                                            conn.rollback();

                                            helpers.showerror(res, "oops something went wrong");


                                        }

                                }


                                });

                            }

                            });

                        }


                        });

                    } else {

                        //shopping cart does not exists create and add item

                        conn.beginTransaction((err) => {

                            if (err) {
                                helpers.showerror(res, err.message);

                            }else{

                            conn.query("INSERT INTO cart (user_id, datetime, sub_total, checkedout) VALUES ( " + userid + ", NOW(), " + cost + ", 'NO' )", (err, result, fields) => {

                                if (err) {

                                    conn.rollback();

                                    helpers.showerror(err.message);

                                }else{

                                //get cartid
                                conn.query("SELECT cart_id FROM cart WHERE user_id = " + userid + " AND checkedout = 'NO'", (err, result, fields) => {
                                    if (err) {

                                        conn.rollback();

                                        helpers.showerror(err.message);

                                    }else{

                                    let cartid = result[0].cart_id;


                                    //save item
                                    conn.query("INSERT INTO cartitems (cart_id, item_name, item_description, datetime, currency, cost) VALUES (" + cartid + ", '" + productname + "', '" + itemdescription + "', NOW(), 'KSH', " + cost + ")", (err, result, fields) => {

                                        if (err) {
                                            conn.rollback();


                                            helpers.showerror(res, err.message);

                                        }else{


                                        //commit transaction

                                        conn.commit((err) => {
                                            if (err) {

                                                conn.rollback();

                                                helpers.showerror(err.message);
                                            }else{

                                            conn.query("SELECT cart_id, item_name, item_description, cost, currency, datetime FROM cartitems WHERE cart_id = " + cartid, (err, result, fields) => {

                                                if (err){

                                                    helpers.showerror(res, err.message);

                                                }else {


                                                    helpers.showjson(res, result);

                                                }


                                            });

                                        }


                                        });


                                    }


                                    });

                                }


                                });

                            }


                            });

                        }


                        });


                    }

                }


                });


                //helpers.showjson(res, cost);

            } else {

                helpers.showtext(res, "no price found");

            }

        }

        });

    }



});


app.post("/checkout", url_encoder, (req, res)=>{

    if(req.body.cartid === undefined ||  req.body.supplierid === undefined){

        helpers.showtext(res, "please input all the fields")

    }else{

        let cartid = req.body.cartid;

        let supplier_id  = req.body.supplierid;

        conn.query("SELECT supplier_name, longitude, latitude, discount, delivery_cost, DATE_FORMAT(DATE_ADD(NOW(), INTERVAL 1 HOUR ), '%W %d %M %l:%i %p') AS deliverydate FROM suppliers WHERE supplier_id = "+ supplier_id, (err, result, fields)=>{

            if(err) {
                helpers.showerror(res, err.message);

            }else {

                helpers.showjson(res, result);

            }

        });


    }

});


app.post("/getorders", url_encoder, (req, res)=>{


    if(req.body.userid === undefined){

        helpers.showtext(res, "please provide all the required fields");

    }else{

      let userid = req.body.userid;

      conn.query("SELECT supplier_name, logo, phone_number, order_id, cart_id, delivery_status, delivery_location, verification_code, DATE_FORMAT(delivery_time, '%W %d %M %l:%i %p') AS deliverydate FROM orders INNER JOIN suppliers ON orders.supplier_id = suppliers.supplier_id WHERE user_id = " + userid + " ORDER BY datetime DESC", (err, result, fields)=>{

         if(err) {
             helpers.showerror(res, err.message);

         }else {

             if (result.length > 0) {

                 helpers.showjson(res, result);

             } else {

                 helpers.showtext(res, "sorry you do not have any orders");

             }

         }


      });


    }


});


app.post("/payment", url_encoder,  (req, res)=>{



    if(req.body.phonenumber === undefined  || req.body.cost === undefined){

        helpers.showtext(res, "please input all the fields")


    }else{

        let phonenumber = req.body.phonenumber;


        let totalcost = req.body.cost;





        //setup mpesapayment request

          let consumerkey = "TLAExhMXS5zyRRwk18GtM00aqxS40dOz";
          let consumersecret = "4KbDtRhJLefQFE9Q";
          let  oauth_token = "053MT2nQQHF6A9X1serXfwxJJpCY";
          let  url = "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest";
          let auth = "Bearer " + oauth_token;
          let  shortCode = 174379;
          let passkey = "bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919";
          let gottimestamp  = timestamp('YYYYMMDDHHmmss');


          let password = baseeconcoder.encode(shortCode + passkey +gottimestamp);

        request(
            {
                method: 'POST',
                url : url,
                headers : {
                    "Authorization" : auth
                },
                json : {
                    "BusinessShortCode": shortCode,
                    "Password": password,
                    "Timestamp": gottimestamp,
                    "TransactionType": "CustomerPayBillOnline",
                    "Amount": totalcost,
                    "PartyA": phonenumber,
                    "PartyB": shortCode,
                    "PhoneNumber": phonenumber,
                    "CallBackURL": "https://4cb32922.ngrok.io/paymentcallback",
                    "AccountReference": "MyGas App",
                    "TransactionDesc": "Gas Order"
                }
            },
            function (error, response, body) {
                // TODO: Use the body object to extract the response
                console.log(body)

                helpers.showjson(res, body);
            }
        )

    }



});

app.post("/paymentcallback", bodyparser_json, (req, res)=>{

    let json_response = req.body;

    let merchantrequestid = json_response.Body.stkCallback.MerchantRequestID;

    let checkoutrequestid = json_response.Body.stkCallback.CheckoutRequestID;

    let resultcode = json_response.Body.stkCallback.ResultCode;

    let callbackmetadata = json_response.Body.stkCallback.CallbackMetadata;

    let amount = json_response.Body.stkCallback.CallbackMetadata.Item[0].Value;

    let transaction_code = json_response.Body.stkCallback.CallbackMetadata.Item[1].Value;

    let phonenumber = new String(json_response.Body.stkCallback.CallbackMetadata.Item[4].Value)

    let formatted_phonenumber = phonenumber.replace("254", "+254");



    //save to payments table

    conn.query("INSERT INTO mpesapayments (phonenumber, transactioncode, amount, datetime, verified) VALUES (' "+ formatted_phonenumber + " ', ' "+ transaction_code + " ', " + amount + ", NOW(), 'NO')", (err, result, fields)=>{

       if(err){
           console.log(err.message);

           helpers.showerror(res, err.message);

       }else {

           if(result.affectedRows > 0) {


               console.log("ok");

               helpers.showtext(res, "ok");

           }else{

               console.log("mpesa payments table data not inserted");
               helpers.showtext(res, "oops something went wrong");



           }

       }


    });


});

app.post("/confirmpayment", url_encoder, (req, res)=>{


if(req.body.cartid === undefined || req.body.userid === undefined || req.body.cost === undefined ||
    req.body.deliverylocation === undefined || req.body.supplierid === undefined ||
    req.body.deliverycost === undefined || req.body.distance === undefined || req.body.longitude === undefined ||
    req.body.latitude === undefined || req.body.phonenumber === undefined) {

    helpers.showtext(res, "please input all the values");

}else{

    let cartid = req.body.cartid;

    let userid = req.body.userid;

    let totalcost = req.body.cost;

    let deliverylocation =  conn.escape(req.body.deliverylocation);

    let supplierid = req.body.supplierid;

    let deliverycost = req.body.deliverycost;

    let distance = req.body.distance;

    let longitude = req.body.longitude;

    let latitude = req.body.latitude;

    let phonenumber = req.body.phonenumber;

    let verificationcode = Math.floor(Math.random() * 1000) +1;

    //check if payment has been made

    conn.query("SELECT transactioncode, amount FROM mpesapayments WHERE phonenumber = "+ phonenumber + " AND amount >= " +totalcost + " AND verified = 'NO'", (err, result, fields)=>{

        if(err) {
            helpers.showerror(res, err.message);


        }else {


            //payment is successful
            if (result.length > 0) {

                let transactioncode = result[0].transactioncode;

                console.log(transactioncode);

                let mpesaamount = result[0].amount;

                //save to orders table

                conn.beginTransaction((err) => {

                    if (err) {
                        helpers.showerror(res, err.message);

                    }else{

                    conn.query("INSERT INTO orders (cart_id, user_id, delivery_cost, total_cost, delivery_status, delivery_time, datetime, delivery_location, longitude, latitude, supplier_id, distance, verification_code) VALUES ( " + cartid + " , " + userid + " , " + deliverycost + " , " + totalcost + " ,  'UNDELIVERED' , DATE_ADD(NOW(), INTERVAL 1 HOUR ), NOW(), " + deliverylocation + " , " + longitude + " , " + latitude + " , " + supplierid + " , " + distance + ", " + verificationcode + " )", (err, result, fields) => {

                        if (err) {

                            conn.rollback();

                            helpers.showerror(res, err.message);

                        }else{

                        //get orderid

                        conn.query("SELECT order_id FROM orders ORDER BY order_id DESC LIMIT 1", (err, result, fields) => {

                            if (err) {

                                conn.rollback();

                                helpers.showerror(res, err.message);


                            }else{

                            if (result.length > 0) {


                                let orderid = result[0].order_id;

                                //save to payments table

                                conn.query("INSERT INTO payment (order_id, user_id, supplier_id, amount, currency, payment_method, datetime, transaction_code) VALUES ( " + orderid + " , " + userid + " , " + supplierid + " , " + mpesaamount + " , ' KES ' , ' MPESA ', NOW() ,  ' " + transactioncode + " ' )", (err, result, fields) => {


                                    if (err) {

                                        conn.rollback();

                                        helpers.showerror(res, err.message);


                                    }else{


                                        console.log(transactioncode);
                                    //set mpesa payment verified
                                    conn.query("UPDATE mpesapayments SET verified = 'YES' WHERE transactioncode =  '" + transactioncode + "'", (err, result, fields) => {

                                        if (err) {

                                            conn.rollback();

                                            helpers.showerror(res, err.message);



                                        }else {

                                            if(result.affectedRows  > 0  ) {


                                            //update cart as checkedout

                                            conn.query("UPDATE cart SET checkedout = 'YES' WHERE cart_id = " + cartid, (err, result, fields) => {

                                                if (err) {

                                                    conn.rollback();

                                                    helpers.showerror(res, err.message);


                                                } else {

                                                    if(result.affectedRows > 0){


                                                    conn.commit((err) => {

                                                        if (err) {

                                                            conn.rollback();

                                                            helpers.showerror(err.message);
                                                        } else {

                                                            helpers.showtext(res, "success");

                                                        }

                                                    });

                                                }else{

                                                        conn.rollback();

                                                        helpers.showerror(res, "oops something went wrong");

                                                        console.log("update shopping cart error");


                                                    }

                                                }


                                            });

                                        }else {

                                                conn.rollback();

                                                helpers.showerror(res, "oops something went wrong");

                                                console.log("update mpesapayments error");
                                            }

                                    }


                                    });

                                }


                                });


                                //
                            } else {
                                conn.rollback();

                                helpers.showtext(res, "oops something went wrong try again")
                            }


                        }

                        });

                    }


                    });

                }
                });


                //payment is not successful
            } else {

                helpers.showtext(res, "your payment has not been received please try again");


            }


        }

    });


}










});

app.post ("/verifydelivery", url_encoder, (req, res)=>{


  if(req.body.orderid === undefined || req.body.verificationcode === undefined){

      helpers.showtext(res, "please input all the values");

  }  else{

      let orderid = req.body.orderid;

      let code = req.body.verificationcode;


      conn.query("SELECT verification_code FROM orders WHERE order_id = "+orderid , (err, result, fields)=> {

          if (err) {
              helpers.showerror(res, err.message);


          }else{


          if (result.length > 0) {


              if (code == result[0].verification_code) {


                  conn.query("UPDATE orders SET delivery_status = 'DELIVERED' WHERE order_id = " + orderid, (err, result, fields) => {
                      if (err) {
                          helpers.showerror(res, err.message);

                      }else {

                          if(result.affectedRows > 0) {
                              helpers.showtext(res, "order#" + orderid + " successsfully delivered");

                          }else{

                              console.log("could not verify order");

                              helpers.showtext(res, "oops something went wrong please try again");

                          }

                      }

                  });


              } else {


                  helpers.showtext(res, "your delievery verification code is invalid");
              }


          } else {


              helpers.showtext(res, "sorry your orderid is invalid");

          }

      }


      });



  }




});




app.listen(3000);

