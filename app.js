const fleet = await fetch('/fleet.json').then(r => { if (!r.ok) throw new Error('Fleet data could not load'); return r.json(); });
const policy = await fetch('/rental-policy.json').then(r => { if (!r.ok) throw new Error('Rental policy could not load'); return r.json(); });
const money = value => 'PKR ' + Math.round(value).toLocaleString('en-PK');
const params = new URLSearchParams(location.search);
let category = params.get('category') || 'all';
let group = params.get('group') || '';
const groups = { compact:[8,9,10,11,12,13], premium:[14], luxury:[21,22], oversize:[15,16,17,18,19,20,23,24], mini:[1,6], economy:[2,3,4,5,7] };
if (!groups[group]) group='';
if (!['all', 'Economy', 'Sedan', 'SUV', 'Premium', 'MPV'].includes(category)) category = 'all';
const pickup = document.querySelector('#pickup');
const dropoff = document.querySelector('#return');
const localDate = date => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
const today = new Intl.DateTimeFormat('en-CA', { timeZone:'Asia/Karachi', year:'numeric', month:'2-digit', day:'2-digit' }).format(new Date());
const nextDay = value => { const date = new Date(value + 'T12:00:00'); date.setDate(date.getDate()+1); return localDate(date); };
const validDate = value => /^\d{4}-\d{2}-\d{2}$/.test(value || '') && Number.isFinite(new Date(value + 'T12:00:00').getTime());
pickup.min = today;
pickup.value = validDate(params.get('pickup')) && params.get('pickup') >= today ? params.get('pickup') : today;
dropoff.min = nextDay(pickup.value);
dropoff.value = validDate(params.get('return')) && params.get('return') > pickup.value ? params.get('return') : nextDay(pickup.value);
const locationSelect = document.querySelector('#location');
if ([...locationSelect.options].some(o => o.value === params.get('location'))) locationSelect.value = params.get('location');
pickup.addEventListener('change', () => { if (!validDate(pickup.value)) return; dropoff.min = nextDay(pickup.value); if (dropoff.value <= pickup.value) dropoff.value = dropoff.min; });
const days = () => Math.round((new Date(dropoff.value+'T12:00:00') - new Date(pickup.value+'T12:00:00')) / 86400000);
const grid = document.querySelector('#cars');
const search = document.querySelector('#fleet-search');
function render() {
  const query = search.value.trim().toLowerCase();
  let list = fleet.filter(car => (group ? groups[group].includes(car.id) : (category === 'all' || car.category === category)) && `${car.make} ${car.name}`.toLowerCase().includes(query));
  const sort = document.querySelector('#sort').value;
  if (sort !== 'featured') list.sort((a,b) => sort === 'low' ? a.rate-b.rate : b.rate-a.rate);
  document.querySelector('#results').textContent = `${list.length} car${list.length===1?'':'s'} to explore${group?' · '+group.charAt(0).toUpperCase()+group.slice(1):category==='all'?'':' · '+(category==='MPV'?'7-Seaters':category)}`;
  document.querySelectorAll('[data-category]').forEach(button => { const active = !group && button.dataset.category === category; button.classList.toggle('active', active); button.setAttribute('aria-pressed', String(active)); });
  grid.innerHTML = list.length ? list.map((car,index) => `<article class="car-card"><div class="car-photo"><img src="${car.image}" alt="${car.make} ${car.name} model illustration" width="1536" height="1024" loading="${index<3?'eager':'lazy'}" decoding="async"><span class="car-tag">${car.category==='MPV'?'7-Seater':car.category} · Model illustration</span></div><div class="car-body"><span class="make">${car.make}</span><h3>${car.make} ${car.name}</h3><p class="car-detail-text">${car.description}</p><div class="specs"><span>♙ ${car.seats} seats</span><span>◉ ${car.transmission}</span><span>⌖ Lahore</span></div><div class="car-price"><div><small>DAILY RENTAL RATE</small><b>${money(car.rate)} <span>/ day</span></b></div><button data-book="${car.id}" aria-label="View rental estimate for ${car.make} ${car.name}">View car ↗</button></div></div></article>`).join('') : '<div class="fleet-empty"><h3>No cars match that search.</h3><p>Try another model or explore all categories.</p><button class="primary" id="reset-filters">Show all cars ↗</button></div>';
  document.querySelector('#reset-filters')?.addEventListener('click', () => { category='all'; group=''; search.value=''; render(); });
}
document.querySelectorAll('[data-category]').forEach(button => button.addEventListener('click', () => { category=button.dataset.category; group=''; render(); }));
document.querySelector('#sort').addEventListener('change', render);
search.addEventListener('input', render);
document.querySelector('#search').addEventListener('submit', event => { event.preventDefault(); const error=document.querySelector('.search-error'); if (!Number.isFinite(days()) || days()<1 || pickup.value<today) { error.textContent='Choose a valid pickup date and a later return date.'; return; } error.textContent=''; document.querySelector('#trip-summary').textContent=`${locationSelect.value} · ${days()} day${days()===1?'':'s'} · ${pickup.value} to ${dropoff.value}`; render(); document.querySelector('#fleet').scrollIntoView({behavior:'smooth'}); });
const modal = document.querySelector('#booking');
document.querySelector('.close').addEventListener('click', () => modal.close());
modal.addEventListener('click', event => { if (event.target !== modal) return; const r=modal.getBoundingClientRect(); if(event.clientX<r.left || event.clientX>r.right || event.clientY<r.top || event.clientY>r.bottom) modal.close(); });
grid.addEventListener('click', async event => {
  const trigger=event.target.closest('[data-book]'); if(!trigger) return;
  if(!Number.isFinite(days()) || days()<1 || pickup.value<today) { document.querySelector('.search-error').textContent='Please choose valid rental dates first.'; document.querySelector('#search').scrollIntoView({behavior:'smooth'}); pickup.focus(); return; }

  await window.mzgAuth.ready;
  if(window.mzgAuth.state.error){document.querySelector('.search-error').textContent='Account service could not load. Refresh and try again.';return;}
  const selected=fleet.find(c=>c.id===Number(trigger.dataset.book));
  let savedDraft;try{const d=JSON.parse(sessionStorage.getItem('mzg-booking-draft')||'null');if(d&&d.expires>Date.now()&&Number(d.carId)===selected.id)savedDraft=d;}catch{}
  if(!window.mzgAuth.state.user){sessionStorage.setItem('mzg-booking-draft',JSON.stringify({carId:selected.id,pickup:pickup.value,return:dropoff.value,pickupTime:'10:00',returnTime:'10:00',location:locationSelect.value,expires:Date.now()+1800000}));location.assign('/login.html?next='+encodeURIComponent('/fleet.html?book='+selected.id));return;}
  document.querySelector('#booking-content').innerHTML=`<div class="eyebrow orange">PLAN YOUR LAHORE RENTAL</div><h2 class="booking-title">Your car. Your dates.</h2><form id="booking-form"><label class="booking-label">Choose your car<select id="booking-car" class="booking-select">${fleet.map(c=>'<option value="'+c.id+'">'+c.make+' '+c.name+' — '+money(c.rate)+'/day</option>').join('')}</select></label><img id="booking-image" class="booking-car-photo" alt=""><div class="booking-fields"><label>Pickup date<input id="booking-pickup" type="date" required min="${today}" value="${pickup.value}"></label><label>Pickup time<input id="booking-pickup-time" type="time" required value="10:00"></label><label>Return date<input id="booking-return" type="date" required min="${pickup.value}" value="${dropoff.value}"></label><label>Return time<input id="booking-return-time" type="time" required value="10:00"></label><label>Number of days<input id="booking-days" type="number" required min="1" step="1" value="${days()}"></label><label>Pickup location<select id="booking-location">${[...locationSelect.options].map(o=>'<option>'+o.value+'</option>').join('')}</select></label><label>Your name<input id="booking-name" readonly autocomplete="name"></label><label>Phone / WhatsApp<input id="booking-phone" type="tel" required pattern="[+0-9 ()-]{7,30}" autocomplete="tel" placeholder="03XXXXXXXXX"></label><label class="booking-additional">Additional requests (optional)<textarea id="booking-requests" rows="3" maxlength="2000" placeholder="Child seats, luggage or other requirements"></textarea></label></div><p id="booking-error" role="alert"></p><div class="quote"><span>Rental estimate</span><strong id="total"></strong></div><div id="booking-policy" class="booking-policy" aria-live="polite"></div><p class="fine-print">Fuel, delivery, taxes and optional extras are excluded and will be itemised before you confirm. Photos illustrate the model; actual year, trim and colour may differ. Availability requires MZG confirmation.</p><label class="policy-consent"><input type="checkbox" required> <span>I have read the <a href="/rental-policy.html" target="_blank" rel="noopener">rental policy</a>. I understand this is a Pending rental request, subject to MZG confirmation.</span></label><button class="primary" type="submit">Review booking request ↗</button></form><div id="booking-review" hidden></div>`;
  const field=id=>document.getElementById('booking-'+id);
  field('car').value=selected.id; field('location').value=locationSelect.value;
  field('name').value=window.mzgAuth.state.user.name;field('phone').value=window.mzgAuth.state.user.phone||'';
  if(pickup.value===today){field('pickup').value=nextDay(today);if(field('return').value<=field('pickup').value)field('return').value=nextDay(field('pickup').value);}
  if(savedDraft){for(const [key,id]of [['pickup','pickup'],['return','return'],['pickupTime','pickup-time'],['returnTime','return-time'],['location','location'],['phone','phone'],['requests','requests']])if(typeof savedDraft[key]==='string')field(id).value=savedDraft[key];}
  const saveDraft=()=>sessionStorage.setItem('mzg-booking-draft',JSON.stringify({carId:Number(field('car').value),pickup:field('pickup').value,return:field('return').value,pickupTime:field('pickup-time').value,returnTime:field('return-time').value,location:field('location').value,phone:field('phone').value,requests:field('requests').value,expires:Date.now()+1800000}));
  let requestKey=crypto.randomUUID();
  const timeValue=(date,time)=>new Date(date+'T'+time+':00+05:00').getTime();
  let quote;
  const updateQuote=()=>{
    const car=fleet.find(c=>c.id===Number(field('car').value));
    const duration=Math.ceil((timeValue(field('return').value,field('return-time').value)-timeValue(field('pickup').value,field('pickup-time').value))/86400000);
    const valid=Number.isFinite(duration)&&duration>=1&&field('pickup').value>=today;
    field('return').min=field('pickup').value;
    field('days').value=valid?duration:'';
    document.querySelector('#booking-review').hidden=true;
    document.querySelector('#booking-image').src=car.image;
    document.querySelector('#booking-image').alt=car.make+' '+car.name+' model illustration';
    document.querySelector('#booking-error').textContent=valid?'':'Choose a valid pickup date and a return date/time after pickup.';
    document.querySelector('#total').textContent=valid?money(car.rate*duration):'—';
    const terms=policy.categories[car.category];
    document.querySelector('#booking-policy').textContent=valid?duration+' rental day(s) · '+money(car.rate)+'/day · '+(duration*policy.includedKmPerDay).toLocaleString()+' km included. Extra mileage: '+money(terms.extraKm)+'/km. Refundable deposit: '+money(terms.deposit)+' (separate from rental). Free cancellation at least 24 hours before pickup; later cancellation/no-show: one daily rental, capped at prepaid rent. Insurance cover and excess must be verified for your selected vehicle before payment.':'';
    quote=valid?{car,duration,terms,total:car.rate*duration}:null;
  };
  document.querySelector('#booking-form').addEventListener('input',event=>{
    requestKey=crypto.randomUUID();saveDraft();if(['booking-name','booking-phone','booking-requests'].includes(event.target.id)){document.querySelector('#booking-review').hidden=true;return;}
    if(event.target===field('days')){
      const length=Number(field('days').value);if(!Number.isInteger(length)||length<1){quote=null;document.querySelector('#booking-error').textContent='Enter a whole number of days, at least 1.';document.querySelector('#booking-review').hidden=true;return;}
      const end=new Date(field('pickup').value+'T12:00:00');end.setDate(end.getDate()+length);field('return').value=localDate(end);field('return-time').value=field('pickup-time').value;
    }
    updateQuote();
  });
  document.querySelector('#booking-form').addEventListener('submit',event=>{
    event.preventDefault();updateQuote();if(!quote)return;
    if(!/^(?:03\d{9}|\+?923\d{9})$/.test(field('phone').value.replace(/[\s()-]/g,''))){document.querySelector('#booking-error').textContent='Enter a Pakistani mobile number: 03XXXXXXXXX or +923XXXXXXXXX.';field('phone').focus();return;}saveDraft();
    const q=quote;
    const message=['Hello MZG Car Rental, please confirm this booking request.','Name: '+field('name').value.trim(),'Phone: '+field('phone').value.trim(),'Car: '+q.car.make+' '+q.car.name,'Pickup: '+field('pickup').value+' '+field('pickup-time').value+' (Pakistan time)','Return: '+field('return').value+' '+field('return-time').value+' (Pakistan time)','Duration: '+q.duration+' rental days','Location: '+field('location').value,'Rental estimate: '+money(q.total)+'; extras excluded.','Separate refundable deposit: '+money(q.terms.deposit),'Included mileage: '+q.duration*policy.includedKmPerDay+' km; extra '+money(q.terms.extraKm)+'/km.','I have read the rental policy. Please confirm vehicle availability, final itemised price and vehicle-specific insurance cover/excess before payment.'].join('\n');
    const review=document.querySelector('#booking-review');review.replaceChildren();const heading=document.createElement('h3');heading.textContent='Review your rental request';const preview=document.createElement('pre');preview.textContent=message+'\nAdditional requests: '+(field('requests').value.trim()||'None');const submit=document.createElement('button');submit.type='button';submit.className='primary';submit.textContent='Submit rental request ↗';const note=document.createElement('p');note.className='fine-print';note.textContent='Your request will be saved as Pending in My Bookings. MZG reviews availability, price and terms before confirming. No payment is collected here.';const status=document.createElement('p');status.setAttribute('role','status');review.append(heading,preview,submit,note,status);review.hidden=false;review.scrollIntoView({behavior:'smooth',block:'nearest'});
    const payload={carId:q.car.id,pickupAt:field('pickup').value+'T'+field('pickup-time').value,returnAt:field('return').value+'T'+field('return-time').value,location:field('location').value,phone:field('phone').value,requests:field('requests').value,consent:true};const key=requestKey;
    submit.addEventListener('click',async()=>{submit.disabled=true;submit.textContent='Submitting request…';status.textContent='';const controls=[...document.querySelector('#booking-form').elements];controls.forEach(control=>control.disabled=true);try{const result=await window.mzgAuth.api('/api/bookings',{method:'POST',data:payload,headers:{'Idempotency-Key':key}});sessionStorage.removeItem('mzg-booking-draft');review.replaceChildren();const title=document.createElement('h3');title.textContent='Request submitted · Pending';const text=document.createElement('p');text.textContent=result.booking.reference+' — '+result.message;const link=document.createElement('a');link.className='primary';link.href='/my-bookings.html?booking='+encodeURIComponent(result.booking.id);link.textContent='Track my request ↗';review.append(title,text,link);document.querySelector('#booking-form').hidden=true;}catch(error){status.textContent=error.message;submit.disabled=false;submit.textContent='Try submitting again ↗';controls.forEach(control=>control.disabled=false);if(error.status===401){saveDraft();location.assign('/login.html?next='+encodeURIComponent('/fleet.html?book='+q.car.id));}}});
  });
  updateQuote();modal.showModal();
});
render();

window.mzgAuth.ready.then(()=>{const id=Number(params.get('book'));if(id&&fleet.some(car=>car.id===id)){const button=grid.querySelector('[data-book="'+id+'"]');button?.click();}});
