const fs=require('node:fs'),path=require('node:path');
const {DatabaseSync}=require('node:sqlite');
function openStore(directory=path.join(__dirname,'.private')){
 fs.mkdirSync(directory,{recursive:true,mode:0o700});const db=new DatabaseSync(path.join(directory,'mzg.sqlite'));
 db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;
 CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY,name TEXT NOT NULL,email TEXT NOT NULL UNIQUE COLLATE NOCASE,phone TEXT NOT NULL DEFAULT '',city TEXT NOT NULL DEFAULT 'Lahore',country TEXT NOT NULL DEFAULT 'Pakistan',salt TEXT NOT NULL,password_hash TEXT NOT NULL,hash_n INTEGER NOT NULL DEFAULT 32768,hash_p INTEGER NOT NULL DEFAULT 3,verified_at TEXT,created_at TEXT NOT NULL,terms_at TEXT NOT NULL,role TEXT NOT NULL DEFAULT 'customer' CHECK(role IN ('customer','admin')),avatar BLOB,updated_at TEXT);
 CREATE TABLE IF NOT EXISTS sessions(token_hash TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,csrf TEXT NOT NULL,created_at INTEGER NOT NULL,last_seen INTEGER NOT NULL,expires INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS tokens(token_hash TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,purpose TEXT NOT NULL,target TEXT,expires INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS bookings(id TEXT PRIMARY KEY,reference TEXT NOT NULL UNIQUE,user_id TEXT NOT NULL REFERENCES users(id),car_id INTEGER NOT NULL,car_name TEXT NOT NULL,car_image TEXT NOT NULL,pickup_at TEXT NOT NULL,return_at TEXT NOT NULL,location TEXT NOT NULL,phone TEXT NOT NULL,requests TEXT NOT NULL DEFAULT '',days INTEGER NOT NULL,daily_rate INTEGER NOT NULL,estimate INTEGER NOT NULL,quoted_price INTEGER,prepaid_amount INTEGER NOT NULL DEFAULT 0,status TEXT NOT NULL DEFAULT 'Pending' CHECK(status IN ('Pending','Confirmed','Active','Completed','Cancelled')),owner_note TEXT NOT NULL DEFAULT '',cancellation_fee INTEGER NOT NULL DEFAULT 0,policy TEXT NOT NULL,created_at TEXT NOT NULL,updated_at TEXT NOT NULL,idempotency TEXT NOT NULL,UNIQUE(user_id,idempotency));
 CREATE TABLE IF NOT EXISTS booking_events(id INTEGER PRIMARY KEY,booking_id TEXT NOT NULL REFERENCES bookings(id),actor_id TEXT NOT NULL REFERENCES users(id),status TEXT NOT NULL,note TEXT NOT NULL,created_at TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS limits(key TEXT PRIMARY KEY,count INTEGER NOT NULL,expires INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS metadata(key TEXT PRIMARY KEY,value TEXT NOT NULL);
 CREATE INDEX IF NOT EXISTS bookings_user ON bookings(user_id,created_at);
 CREATE INDEX IF NOT EXISTS sessions_user ON sessions(user_id);
 `);
 const transaction=fn=>{db.exec('BEGIN IMMEDIATE');try{const result=fn();db.exec('COMMIT');return result;}catch(e){db.exec('ROLLBACK');throw e;}};
 const legacy=path.join(directory,'accounts.json');
 if(fs.existsSync(legacy)&&!db.prepare("SELECT 1 FROM metadata WHERE key='json_migrated'").get()){
  const users=JSON.parse(fs.readFileSync(legacy,'utf8'));if(!Array.isArray(users))throw new Error('Invalid legacy user file');
  transaction(()=>{const insert=db.prepare('INSERT OR IGNORE INTO users(id,name,email,salt,password_hash,hash_n,hash_p,verified_at,created_at,terms_at) VALUES(?,?,?,?,?,?,?,?,?,?)');for(const u of users){if(!u.id||!u.email||!u.salt||!u.hash)throw new Error('Incomplete legacy account');insert.run(u.id,u.name,u.email.toLowerCase(),u.salt,u.hash,16384,1,u.emailVerified?u.createdAt:null,u.createdAt,u.termsAcceptedAt||u.createdAt);}db.prepare("INSERT INTO metadata VALUES('json_migrated',?)").run(new Date().toISOString());});
 }
 return {db,transaction,directory};
}
module.exports={openStore};
