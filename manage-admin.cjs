const {openStore}=require('./store.cjs');
const [action,email]=process.argv.slice(2);
if(!['promote','demote'].includes(action)||!email){console.error('Usage: node manage-admin.cjs promote|demote owner@example.com');process.exit(1);}
const {db}=openStore();try{const user=db.prepare('SELECT id FROM users WHERE email=?').get(email.trim().toLowerCase());if(!user)throw new Error('Create the account through the website first.');db.prepare('UPDATE users SET role=? WHERE id=?').run(action==='promote'?'admin':'customer',user.id);db.prepare('DELETE FROM sessions WHERE user_id=?').run(user.id);console.log('Role updated. This account must sign in again.');}catch(e){console.error(e.message);process.exitCode=1;}finally{db.close();}
