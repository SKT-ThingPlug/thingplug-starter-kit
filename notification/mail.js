
var nodemailer = require('nodemailer');

exports.request = function(mailoptions){
// create reusable transporter object using the default SMTP transport
var GmailID = '';
var GmailPW = '';
var transporter = nodemailer.createTransport('smtps://'+GmailID+':'+GmailPW+'@smtp.gmail.com');

// send mail with defined transport object
transporter.sendMail(mailoptions, function(error, info){
    if(error){
        return console.log(error);
    }
    //console.log('Message sent: ' + info.response);
	
	return console.log('Message sent: ' + info.response);
});
}