创建表 `sql`语句如下

## 用法 

- postgresql
- UI：pgAdmin (https://www.pgadmin.org/)

### 账户表创建

```postgresql
-- Table: public.accounts
 
-- DROP TABLE public.accounts;
 
CREATE TABLE public.accounts
(
    acc_id bigserial,
    account text COLLATE pg_catalog."default" NOT NULL,
    type smallint,
    balance numeric,
    transaction_count numeric,
    CONSTRAINT account_pkey PRIMARY KEY (account)
)
WITH (
    OIDS = FALSE
)
TABLESPACE pg_default;
 
COMMENT ON COLUMN public.accounts.account
    IS '账户地址';
 
COMMENT ON COLUMN public.accounts.type
    IS '账户类型（1普通账户、2合约账户）';
 
COMMENT ON COLUMN public.accounts.balance
    IS '余额，单位是Wei';
COMMENT ON COLUMN public.accounts.transaction_count
    IS '交易数量，该账户相关的交易数量';


-- Index: balance_accid_index

-- DROP INDEX public.balance_accid_index;

CREATE INDEX balance_accid_index
    ON public.accounts USING btree
    (balance, acc_id)
    TABLESPACE pg_default;

-- Index: balance_index

-- DROP INDEX public.balance_index;

CREATE INDEX balance_index
    ON public.accounts USING btree
    (balance)
    TABLESPACE pg_default;

COMMENT ON INDEX public.balance_index
    IS 'balance_index';
```


## 交易表创建

```postgresql
-- Table: public.transaction
 
-- DROP TABLE public.transaction;
 
CREATE TABLE public.transaction
(
    pkid bigserial,
    hash text COLLATE pg_catalog."default" NOT NULL,
    type numeric,
    "from" text COLLATE pg_catalog."default",
    "to" text COLLATE pg_catalog."default",
    amount numeric,
    previous text COLLATE pg_catalog."default",
    witness_list_block text COLLATE pg_catalog."default",
    last_summary text COLLATE pg_catalog."default",
    last_summary_block text COLLATE pg_catalog."default",
    "data" text COLLATE pg_catalog."default",
    exec_timestamp bigint,
    signature text COLLATE pg_catalog."default",
    is_free boolean,
    "level" bigint,
    witnessed_level bigint,
    best_parent text COLLATE pg_catalog."default",
    is_stable boolean,
    status numeric,
    is_on_mc boolean,
    mci bigint,
    latest_included_mci bigint,
    mc_timestamp bigint,
    stable_timestamp bigint,
    is_shown boolean,

    is_witness_account boolean,
    is_witness boolean,


    CONSTRAINT pkid_pkey PRIMARY KEY (pkid)
)
WITH (
    OIDS = FALSE
)
TABLESPACE pg_default;
 
COMMENT ON COLUMN public.transaction.hash
    IS '交易号';
 
COMMENT ON COLUMN public.transaction."from"
    IS '发款方';
 
COMMENT ON COLUMN public.transaction."to"
    IS '收款方';
 
COMMENT ON COLUMN public.transaction.amount
    IS '余额，单位是Wei';
 
COMMENT ON COLUMN public.transaction.previous
    IS '上一个交易号';
 
COMMENT ON COLUMN public.transaction.witness_list_block
    IS '见证人列表Block';
 
COMMENT ON COLUMN public.transaction.last_summary
    IS 'last_summary';
 
COMMENT ON COLUMN public.transaction.last_summary_block
    IS 'last_summary_block';
 
COMMENT ON COLUMN public.transaction."data"
    IS '数据';
 
COMMENT ON COLUMN public.transaction.exec_timestamp
    IS 'exec_timestamp';
 
COMMENT ON COLUMN public.transaction.signature
    IS '签名';
 
COMMENT ON COLUMN public.transaction.is_free
    IS 'is_free';
 
COMMENT ON COLUMN public.transaction."level"
    IS 'level';
 
COMMENT ON COLUMN public.transaction.witnessed_level
    IS 'witnessed_level';
 
COMMENT ON COLUMN public.transaction.best_parent
    IS 'best_parent';
 
COMMENT ON COLUMN public.transaction.is_stable
    IS 'is_stable';

 COMMENT ON COLUMN public.transaction.status
    IS 'status';

COMMENT ON COLUMN public.transaction.is_on_mc
    IS 'is_on_mc';
 
COMMENT ON COLUMN public.transaction.mci
    IS 'mci';
 
COMMENT ON COLUMN public.transaction.latest_included_mci
    IS 'latest_included_mci';
 
COMMENT ON COLUMN public.transaction.mc_timestamp
    IS 'mc_timestamp';


-- Index: from_index

-- DROP INDEX public.from_index;

CREATE INDEX from_index
    ON public.transaction USING btree
    ("from")
    TABLESPACE pg_default;

COMMENT ON INDEX public.from_index
    IS 'from_index';

-- Index: hash_index

-- DROP INDEX public.hash_index;

CREATE UNIQUE INDEX hash_index
    ON public.transaction USING btree
    (hash)
    TABLESPACE pg_default;

-- Index: is_shown_index

-- DROP INDEX public.is_shown_index;

CREATE INDEX is_shown_index
    ON public.transaction USING btree
    (is_shown)
    TABLESPACE pg_default;

-- Index: latest_transaction_index

-- DROP INDEX public.latest_transaction_index;

CREATE INDEX latest_transaction_index
    ON public.transaction USING btree
    (exec_timestamp, level, pkid)
    TABLESPACE pg_default;

COMMENT ON INDEX public.latest_transaction_index
    IS 'latest_transaction_index';

-- Index: to_index

-- DROP INDEX public.to_index;

CREATE INDEX to_index
    ON public.transaction USING btree
    ("to")
    TABLESPACE pg_default;

COMMENT ON INDEX public.to_index
    IS 'to_index';

-- Index: witness_transaction_index

-- DROP INDEX public.witness_transaction_index;

CREATE INDEX witness_transaction_index
    ON public.transaction USING btree
    (exec_timestamp, level, pkid)
    TABLESPACE pg_default    WHERE type = 1::numeric
;

COMMENT ON INDEX public.witness_transaction_index
    IS 'witness_transaction_index, exec_timestamp desc, level desc, pkid desc';

```

## parent表创建

```postgresql
-- Table: public.parents
 
-- DROP TABLE public.parents;
 
CREATE TABLE public.parents
(
    parents_id bigserial,
    item text COLLATE pg_catalog."default" NOT NULL,
    parent text COLLATE pg_catalog."default",
    CONSTRAINT parents_id_pkey PRIMARY KEY (parents_id),
    CONSTRAINT parents_item_parent_key UNIQUE (item, parent)
)
WITH (
    OIDS = FALSE
)
TABLESPACE pg_default;
 
COMMENT ON COLUMN public.parents.item
    IS '元素';
 
COMMENT ON COLUMN public.parents.parent
    IS 'parent';
```

## witness表的创建

```postgresql
-- Table: public.witness
 
-- DROP TABLE public.witness;
 
CREATE TABLE public.witness
(
    witness_id bigserial,
    item text COLLATE pg_catalog."default" NOT NULL,
    account text COLLATE pg_catalog."default",
    CONSTRAINT witness_id_pkey PRIMARY KEY (witness_id),
    CONSTRAINT witness_item_account_key UNIQUE (item, account)
)
WITH (
    OIDS = FALSE
)
TABLESPACE pg_default;
 
COMMENT ON COLUMN public.witness.item
IS '元素';
 
COMMENT ON COLUMN public.witness.account
IS 'account';


```

## timestap表的创建

```
-- Table: public.timestamp
 
-- DROP TABLE public.timestamp;
 
CREATE TABLE public.timestamp
(
    timestamp numeric,
    type bigint,
    count numeric,
    CONSTRAINT timestamp_key PRIMARY KEY (timestamp)
)
WITH (
    OIDS = FALSE
)
TABLESPACE pg_default;
 
COMMENT ON COLUMN public.timestamp.timestamp
    IS 'timestamp';
 
COMMENT ON COLUMN public.timestamp.type
    IS 'type';

COMMENT ON COLUMN public.timestamp.count
    IS 'count';
```


## global

```
-- Table: public.global

-- DROP TABLE public.global;

CREATE TABLE public.global
(
    global_id bigserial,
    key text ,
    value numeric,
    CONSTRAINT global_id_key PRIMARY KEY (global_id)
)
WITH (
    OIDS = FALSE
)
TABLESPACE pg_default;
```
