import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Bell } from 'lucide-react';
import { useLocale } from '../i18n';
import { notificationCopy } from '../notification-copy';
import type { ProgramItem } from '../notifications';
import type { StoredState } from '../types';
const Panel=lazy(()=>import('./Recaps').then(module=>({default:module.ReminderDialog})));
export default function ReminderButton({state,target,title,onDay}:{state:StoredState;target:{kind:ProgramItem['kind'];id:string};title:string;onDay?:(item:ProgramItem)=>void}){
  const {language}=useLocale(),[open,setOpen]=useState(false),trigger=useRef<HTMLButtonElement>(null),wasOpen=useRef(false);
  useEffect(()=>{if(!open && wasOpen.current)trigger.current?.focus();wasOpen.current=open;},[open]);
  return <><button ref={trigger} type="button" className="icon-btn activity-reminder-trigger" aria-haspopup="dialog" aria-label={`${notificationCopy(language,'reminder')} · ${title}`} onClick={()=>setOpen(true)}><Bell size={14}/></button>{open && <Suspense fallback={<p role="status">{notificationCopy(language,'loading')}</p>}><Panel state={state} requestedObject={target} onDay={onDay||(()=>{})} onClose={()=>setOpen(false)}/></Suspense>}</>;
}
