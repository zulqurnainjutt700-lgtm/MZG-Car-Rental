const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {createServer}=require('./server.cjs');const {DatabaseSync}=require('node:sqlite');
const directory=fs.mkdtempSync(path.join(__dirname,'.auth-test-browser-'));
const server=createServer({authDirectory:directory,origin:'http://127.0.0.1:3001',mailer:{configured:false,send(){throw new Error('Not configured');}}});
server.listen(3001,'127.0.0.1',async()=>{try{
 const password=crypto.randomBytes(20).toString('hex');const account={name:'QA Customer',email:'qa-customer@example.test',phone:'03001234567',password,confirmPassword:password,consent:true};
 const response=await fetch('http://127.0.0.1:3001/api/signup',{method:'POST',headers:{'Content-Type':'application/json',Origin:'http://127.0.0.1:3001'},body:JSON.stringify(account)});if(response.status!==201)throw new Error('QA seed failed');
 fs.writeFileSync(path.join(directory,'credentials.json'),JSON.stringify({email:account.email,password,directory}));console.log('Isolated browser QA server: http://127.0.0.1:3001/');console.log('Fixture file: '+path.join(directory,'credentials.json'));
 }catch(e){console.error(e.message);process.exitCode=1;server.close();}});
process.on('SIGINT',()=>server.close(()=>{for(const file of fs.readdirSync(directory))fs.unlinkSync(path.join(directory,file));fs.rmdirSync(directory);process.exit(0);}));
