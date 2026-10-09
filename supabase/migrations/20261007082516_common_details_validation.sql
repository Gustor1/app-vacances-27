-- Align common details with the client validator. Existing records are preserved.
begin;
create function detours_private.valid_currency(p text) returns boolean
language sql immutable set search_path='' as $$ select coalesce(p=any(array['AED','AFN','ALL','AMD','ANG','AOA','ARS','AUD','AWG','AZN','BAM','BBD','BDT','BGN','BHD','BIF','BMD','BND','BOB','BRL','BSD','BTN','BWP','BYN','BZD','CAD','CDF','CHF','CLP','CNY','COP','CRC','CUC','CUP','CVE','CZK','DJF','DKK','DOP','DZD','EGP','ERN','ETB','EUR','FJD','FKP','GBP','GEL','GHS','GIP','GMD','GNF','GTQ','GYD','HKD','HNL','HRK','HTG','HUF','IDR','ILS','INR','IQD','IRR','ISK','JMD','JOD','JPY','KES','KGS','KHR','KMF','KPW','KRW','KWD','KYD','KZT','LAK','LBP','LKR','LRD','LSL','LYD','MAD','MDL','MGA','MKD','MMK','MNT','MOP','MRU','MUR','MVR','MWK','MXN','MYR','MZN','NAD','NGN','NIO','NOK','NPR','NZD','OMR','PAB','PEN','PGK','PHP','PKR','PLN','PYG','QAR','RON','RSD','RUB','RWF','SAR','SBD','SCR','SDG','SEK','SGD','SHP','SLE','SLL','SOS','SRD','SSP','STN','SVC','SYP','SZL','THB','TJS','TMT','TND','TOP','TRY','TTD','TWD','TZS','UAH','UGX','USD','UYU','UZS','VES','VND','VUV','WST','XAF','XCD','XCG','XDR','XOF','XPF','XSU','YER','ZAR','ZMW','ZWG','ZWL']::text[]),false); $$;
create or replace function detours_private.assert_details(p jsonb) returns void
language plpgsql immutable set search_path='' as $$
declare k text; item jsonb; pair record;
begin
  if jsonb_typeof(p) is distinct from 'object' then raise exception 'Invalid common details'; end if;
  foreach k in array array['notes','stayNotes'] loop
    if p ? k then
      if jsonb_typeof(p->k)<>'object' then raise exception 'Invalid notes'; end if;
      for pair in select * from jsonb_each(p->k) loop if jsonb_typeof(pair.value)<>'string' then raise exception 'Invalid note text'; end if; end loop;
    end if;
  end loop;
  foreach k in array array['favorites','done','bookings'] loop
    if p ? k then
      if jsonb_typeof(p->k)<>'array' then raise exception 'Invalid checklist'; end if;
      for item in select * from jsonb_array_elements(p->k) loop if jsonb_typeof(item)<>'string' then raise exception 'Invalid checklist item'; end if; end loop;
    end if;
  end loop;
  if p ? 'cityNotes' then
    if jsonb_typeof(p->'cityNotes')<>'object' then raise exception 'Invalid city notes'; end if;
    for pair in select * from jsonb_each(p->'cityNotes') loop
      if jsonb_typeof(pair.value)<>'array' then raise exception 'Invalid city notes'; end if;
      for item in select * from jsonb_array_elements(pair.value) loop if jsonb_typeof(item)<>'string' then raise exception 'Invalid city note'; end if; end loop;
    end loop;
  end if;
  foreach k in array array['transferPrivate','bonusPrivate','exchangeRates'] loop
    if p ? k and jsonb_typeof(p->k)<>'object' then raise exception 'Invalid details dictionary'; end if;
  end loop;
  for pair in select * from jsonb_each(coalesce(p->'transferPrivate','{}')) loop
    if jsonb_typeof(pair.value)<>'object' or jsonb_typeof(pair.value->'reference') is distinct from 'string' or jsonb_typeof(pair.value->'notes') is distinct from 'string' or jsonb_typeof(pair.value->'booked') is distinct from 'boolean' then raise exception 'Invalid transfer details'; end if;
  end loop;
  for pair in select * from jsonb_each(coalesce(p->'bonusPrivate','{}')) loop
    if jsonb_typeof(pair.value)<>'object' or (pair.value ? 'tip' and jsonb_typeof(pair.value->'tip')<>'string') or (pair.value ? 'sourceUrl' and jsonb_typeof(pair.value->'sourceUrl')<>'string') then raise exception 'Invalid bonus details'; end if;
  end loop;
  if p ? 'budget' and (jsonb_typeof(p->'budget')<>'number' or ((p->>'budget')::numeric<=0 or (p->>'budget')::numeric>1e308)) then raise exception 'Invalid budget'; end if;
  if p ? 'budgetCurrency' and (jsonb_typeof(p->'budgetCurrency')<>'string' or not detours_private.valid_currency(p->>'budgetCurrency')) then raise exception 'Invalid currency'; end if;
  for pair in select * from jsonb_each(coalesce(p->'exchangeRates','{}')) loop if not detours_private.valid_currency(pair.key) or jsonb_typeof(pair.value)<>'number' or (pair.value::text::numeric<=0 or pair.value::text::numeric>1e308) then raise exception 'Invalid rate'; end if; end loop;
  foreach k in array array['documents','expenses','packing','phrases'] loop
    if p ? k then
      if jsonb_typeof(p->k)<>'array' or jsonb_array_length(p->k)>10000 then raise exception 'Invalid detail collection'; end if;
      if (select count(*)<>count(distinct v->>'id') from jsonb_array_elements(p->k) v) then raise exception 'Duplicate detail IDs'; end if;
      for item in select * from jsonb_array_elements(p->k) loop
        if jsonb_typeof(item)<>'object' or jsonb_typeof(item->'id') is distinct from 'string' or length(btrim(item->>'id'))=0 then raise exception 'Invalid detail item'; end if;
        if k='documents' and (jsonb_typeof(item->'title') is distinct from 'string' or length(btrim(item->>'title'))=0 or jsonb_typeof(item->'content') is distinct from 'string' or length(item->>'content')>500000 or jsonb_array_length(p->k)>100) then raise exception 'Invalid document'; end if;
        if k='packing' and (jsonb_typeof(item->'label') is distinct from 'string' or length(btrim(item->>'label'))=0 or jsonb_typeof(item->'packed') is distinct from 'boolean') then raise exception 'Invalid packing item'; end if;
        if k='phrases' and (jsonb_typeof(item->'category') is distinct from 'string' or jsonb_typeof(item->'meaning') is distinct from 'string' or jsonb_typeof(item->'local') is distinct from 'string' or jsonb_typeof(item->'pronunciation') is distinct from 'string') then raise exception 'Invalid phrase'; end if;
        if k='expenses' and (jsonb_typeof(item->'label') is distinct from 'string' or length(btrim(item->>'label'))=0 or jsonb_typeof(item->'cityId') is distinct from 'string' or jsonb_typeof(item->'amount') is distinct from 'number' or (item->>'amount')::numeric<=0 or (item->>'amount')::numeric>1e308 or jsonb_typeof(item->'currency') is distinct from 'string' or not detours_private.valid_currency(item->>'currency') or jsonb_typeof(item->'category') is distinct from 'string' or item->>'category' not in ('food','transport','hotel','visit','shopping','other')) then raise exception 'Invalid expense'; end if;
        if k='expenses' and item ? 'date' then
          if jsonb_typeof(item->'date') is distinct from 'string' then raise exception 'Invalid expense date'; end if;
          if item->>'date'<>'' then
            if item->>'date'!~'^[0-9]{4}-[0-9]{2}-[0-9]{2}$' then raise exception 'Invalid expense date'; end if;
            perform (item->>'date')::date;
          end if;
        end if;
      end loop;
    end if;
  end loop;
end $$;


revoke all on function detours_private.valid_currency(text) from public,anon,authenticated;
commit;
