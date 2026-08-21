with m(cod, func, tipo, grupo) as (values
 ('994',1,'sem-movimento','NACAMURA'),('743',1,'sem-movimento',null),('1115',1,'sem-movimento',null),
 ('1485',2,'sem-movimento',null),('1193',1,'sem-movimento','FRANBRAZ'),('795',2,'sem-movimento','SARGES'),
 ('1001',28,'sem-movimento','SARGES'),('779',1,'sem-movimento','SARGES'),('780',10,'sem-movimento','SARGES'),
 ('1102',1,'sem-movimento','FPN'),('809',17,'sem-movimento',null),('1106',1,'sem-movimento',null),
 ('995',27,'com-movimento','NACAMURA'),('654',1,'com-movimento','FENIX'),('752',9,'com-movimento',null),
 ('961',240,'com-movimento',null),('542',21,'com-movimento','EDUARDO'),('544',3,'com-movimento',null),
 ('1458',1,'com-movimento','BRENO TRASEL'),('1228',1,'com-movimento',null),('205',8,'com-movimento',null),
 ('390',12,'com-movimento','SANTOS BARBOSA'),('1547',5,'com-movimento','J W M DO CARMO'),('1543',7,'com-movimento',null),
 ('999',3,'com-movimento',null),('1066',2,'com-movimento','FPN'),('996',3,'com-movimento',null),
 ('710',26,'com-movimento',null),('968',1,'com-movimento',null),('1462',5,'com-movimento','FRANBRAZ'),
 ('11',null,'domestico-pf','NACAMURA'),('100',null,'domestico-pf','NACAMURA'),('657',null,'domestico-pf','FENIX'),
 ('358',null,'domestico-pf','FENIX'),('1470',null,'domestico-pf',null),('1161',null,'domestico-pf',null)
), gs as (
 select d->>'id' id, upper(d->>'nome') nome from jsonb_array_elements((select dados from app_state where chave='grupos')) d
), novo as (
 select jsonb_agg(
   case when d->>'carteira' = 'RH - G - 02' and m.cod is not null then
     d || jsonb_build_object('tipo', m.tipo)
       || case when m.func is not null then jsonb_build_object('funcionarios', m.func) else '{}'::jsonb end
       || case when gs.id is not null then jsonb_build_object('grupoId', gs.id) else '{}'::jsonb end
   else d end order by ord) arr
 from jsonb_array_elements((select dados from app_state where chave='empresas')) with ordinality t(d, ord)
 left join m on m.cod = d->>'codigoDominio'
 left join gs on gs.nome = upper(m.grupo)
)
update app_state set dados = (select arr from novo), updated_at = now() where chave='empresas';

with e as (
 select d->>'id' emp_id, d->>'grupoId' gid
 from jsonb_array_elements((select dados from app_state where chave='empresas')) d
 where d->>'carteira' = 'RH - G - 02' and d->>'grupoId' is not null
), novo as (
 select jsonb_agg(
   d || jsonb_build_object('empresaIds', (
     select jsonb_agg(distinct x) from (
       select jsonb_array_elements_text(coalesce(d->'empresaIds','[]'::jsonb)) x
       union select emp_id from e where e.gid = d->>'id'
     ) u
   )) order by ord) arr
 from jsonb_array_elements((select dados from app_state where chave='grupos')) with ordinality t(d, ord)
)
update app_state set dados = (select arr from novo), updated_at = now() where chave='grupos';