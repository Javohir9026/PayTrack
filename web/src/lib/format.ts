import { months, type Lang } from './i18n';
export const money=(n:number,lang:Lang='uz')=>new Intl.NumberFormat(lang==='ru'?'ru-RU':'uz-UZ').format(n)+' '+(lang==='ru'?'сум':"so'm");
export const monthLabel=(m:string,lang:Lang='uz')=>{const [y,x]=m.split('-');return `${months[lang][Number(x)-1]} ${y}`};
export const today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Tashkent',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
