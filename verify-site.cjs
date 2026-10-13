const fs=require('node:fs');
const assert=require('node:assert/strict');
const pages=['login.html','forgot-password.html','reset-password.html','verify-email.html','dashboard.html','profile.html','my-bookings.html','account-settings.html','admin.html','signup.html','rental-policy.html','index.html','fleet.html','about.html','contact.html','rental-plans.html','privacy-policy.html','terms-and-conditions.html','image-credits.html'];
for(const page of pages){
 const html=fs.readFileSync(page,'utf8');
 assert.equal((html.match(/<h1[ >]/g)||[]).length,1,page+' should have one primary heading');
 assert.ok(html.includes('contact.zulqurnain@gmail.com'),page+' missing email');
 assert.ok(html.includes('https://wa.me/923025184681'),page+' missing WhatsApp');
 for(const match of html.matchAll(/(?:href|src)="([^"]+)"/g)){
  const url=match[1];if(/^(https?:|mailto:|tel:)/.test(url))continue;
  const [target,fragment]=url.split('#');const filename=target.split('?')[0].replace(/^\//,'')|| (url.startsWith('#')?page:'index.html');
  assert.ok(fs.existsSync(filename),page+' has broken link '+url);
  if(fragment && filename.endsWith('.html'))assert.ok(fs.readFileSync(filename,'utf8').includes('id="'+fragment+'"'),page+' has missing anchor '+url);
 }
 console.log('PASS '+page);
}
const fleet=JSON.parse(fs.readFileSync('fleet.json','utf8'));
assert.ok(fleet.length>=20);
assert.equal(new Set(fleet.map(car=>car.id)).size,fleet.length);
fleet.forEach(car=>assert.ok(fs.statSync(car.image.slice(1)).size>1000,car.name+' missing image'));
assert.ok(!fs.readFileSync('index.html','utf8').includes('id="cars"'),'Fleet must be on its own page');
assert.ok(fs.readFileSync('fleet.html','utf8').includes('id="cars"'));
console.log('PASS '+fleet.length+' cars and local photos; dedicated fleet page');

const policy=JSON.parse(fs.readFileSync('rental-policy.json','utf8'));
assert.equal(policy.includedKmPerDay,200);
fleet.forEach(car=>assert.ok(policy.categories[car.category]?.deposit>0));
for(const page of pages)assert.ok(!/demo/i.test(fs.readFileSync(page,'utf8')),page+' contains removed wording');
assert.ok(!/demo/i.test(fs.readFileSync('app.js','utf8')));
console.log('PASS shared category policies and public wording');
