// Calendar arithmetic uses UTC day numbers derived from local calendar dates.
function today(){const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')}
function periodStart(anchor,cadence,date=today()){
 const day=86400000,a=Date.parse(anchor),now=Date.parse(date);
 if(cadence!=='Monthly'){const step=({Daily:1,Weekly:7,Biweekly:14})[cadence]*day;return new Date(a+Math.floor((now-a)/step)*step).toISOString().slice(0,10)}
 const d=new Date(now),n=new Date(a).getUTCDate(),y=d.getUTCFullYear(),m=d.getUTCMonth();
 const payday=month=>Date.UTC(y,month,Math.min(n,new Date(Date.UTC(y,month+1,0)).getUTCDate()));
 return new Date(payday(m)<=now?payday(m):payday(m-1)).toISOString().slice(0,10)
}
function share(cents,people,name){const i=people.indexOf(name);return i<0?0:Math.floor(cents/people.length)+(i<cents%people.length?1:0)}
if(typeof module!=='undefined')module.exports={share,periodStart}
