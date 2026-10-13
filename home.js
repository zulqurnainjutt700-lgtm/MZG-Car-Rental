const pickup=document.querySelector('#pickup'),dropoff=document.querySelector('#return');
const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Karachi',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const next=value=>{const d=new Date(value+'T12:00:00');d.setDate(d.getDate()+1);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
pickup.min=today;pickup.value=today;dropoff.min=next(today);dropoff.value=next(today);
pickup.addEventListener('change',()=>{if(!pickup.value)return;dropoff.min=next(pickup.value);if(dropoff.value<=pickup.value)dropoff.value=dropoff.min});
document.querySelector('#search').addEventListener('submit',event=>{event.preventDefault();if(!pickup.value||!dropoff.value||dropoff.value<=pickup.value||pickup.value<today){document.querySelector('.search-error').textContent='Choose a valid pickup date and a later return date.';return}const params=new URLSearchParams({pickup:pickup.value,return:dropoff.value,location:document.querySelector('#location').value});location.href='/fleet.html?'+params});
