const nodemailer=require('nodemailer');
function createMailer(env=process.env){
 const configured=Boolean(env.SMTP_HOST&&env.SMTP_FROM);
 let transport;
 if(configured){const port=Number(env.SMTP_PORT||587);if(!Number.isInteger(port)||port<1||port>65535)throw new Error('Invalid SMTP_PORT');transport=nodemailer.createTransport({host:env.SMTP_HOST,port,secure:env.SMTP_SECURE==='true'||port===465,requireTLS:port!==465,auth:env.SMTP_USER?{user:env.SMTP_USER,pass:env.SMTP_PASS}:undefined,tls:{rejectUnauthorized:true},connectionTimeout:10000,greetingTimeout:10000,socketTimeout:15000});}
 return {configured,async send({to,subject,text}){if(!configured)throw new Error('SMTP is not configured');const result=await transport.sendMail({from:env.SMTP_FROM,to,subject,text,disableFileAccess:true,disableUrlAccess:true});if(!result.accepted?.length)throw new Error('Message was not accepted');},async verify(){if(!configured)throw new Error('SMTP is not configured');return transport.verify();}};
}
module.exports={createMailer};
