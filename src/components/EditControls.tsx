import { createContext, useContext, type ButtonHTMLAttributes, type ComponentPropsWithRef, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';

export const ReadOnlyContext = createContext(false);
export const SharedFieldsContext = createContext<string[] | undefined>(undefined);
type CategoryProp = { category?: string };
function useBlocked(category?: string) { const readOnly=useContext(ReadOnlyContext),fields=useContext(SharedFieldsContext); return readOnly || !!(category && fields && !fields.includes(category)); }
export function EditButton({ disabled, category, ...props }: ButtonHTMLAttributes<HTMLButtonElement>&CategoryProp) { const blocked=useBlocked(category); return <button {...props} disabled={blocked || disabled}/>; }
export function EditInput({ disabled, category, ...props }: ComponentPropsWithRef<'input'>&CategoryProp) { const blocked=useBlocked(category); return <input {...props} disabled={blocked || disabled}/>; }
export function EditTextarea({ disabled, category, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>&CategoryProp) { const blocked=useBlocked(category); return <textarea {...props} disabled={blocked || disabled}/>; }
export function EditSelect({ disabled, category, ...props }: SelectHTMLAttributes<HTMLSelectElement>&CategoryProp) { const blocked=useBlocked(category); return <select {...props} disabled={blocked || disabled}/>; }
