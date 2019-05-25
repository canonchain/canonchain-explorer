创建表 `sql` 语句如下

## 用法 

- postgresql
- UI： pgAdmin (https://www.pgadmin.org/)

### 账户表创建

```postgresql
-- Table: public.accounts
 
-- DROP TABLE public.accounts;
 
CREATE TABLE public.accounts
(
    acc_id bigserial,
    account text NOT NULL,
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

## 普通交易表

```postgresql

-- Table: public.trans_normal
 
-- DROP TABLE public.trans_normal;
 
CREATE TABLE public.trans_normal
(
    pkid bigserial,

    -- 所有类型共有的
    "hash" text NOT NULL,
    "type" numeric,
    "from" text,
    "previous" text,
    "exec_timestamp" bigint,
    "work" text,
    "signature" text,
    "level" bigint,
    "is_stable" numeric,
    "stable_index" bigint,
    "status" numeric,
    "mci" bigint,
    "mc_timestamp" bigint,
    "stable_timestamp" bigint,

    -- 普通交易私有的
    "gas" numeric,
    "gas_used" numeric,
    "gas_price" numeric,
    "contract_address" text,
    "log" text,
    "log_bloom" text,

    -- 普通交易和创始交易私有的
    "to" text,
    "amount" numeric,
    "data" text,
    "data_hash" text,
    CONSTRAINT pkid_pkey PRIMARY KEY (pkid)
)
WITH (
    OIDS = FALSE
)
TABLESPACE pg_default;

-- Index: from_index

-- DROP INDEX public.from_index;

CREATE INDEX from_index
    ON public.trans_normal USING btree
    ("from")
    TABLESPACE pg_default;

COMMENT ON INDEX public.from_index
    IS 'from_index';

-- Index: hash_index

-- DROP INDEX public.hash_index;

CREATE UNIQUE INDEX hash_index
    ON public.trans_normal USING btree
    (hash)
    TABLESPACE pg_default;
```

## 见证交易表(存创始hash的简要信息)

```postgresql
-- Table: public.trans_witness
 
-- DROP TABLE public.trans_witness;
 
CREATE TABLE public.trans_witness
(
    wtransid bigserial,

    -- 所有类型共有的
    "hash" text NOT NULL,
    "type" numeric,
    "from" text,
    "previous" text,
    "exec_timestamp" bigint,
    "work" text,
    "signature" text,
    "level" bigint,
    "is_stable" numeric,
    "stable_index" bigint,
    "status" numeric,
    "mci" bigint,
    "mc_timestamp" bigint,
    "stable_timestamp" bigint,

    -- 见证交易私有的
    "last_stable_block" text,
    "last_summary_block" text,
    "last_summary" text,
    "is_free" numeric,
    "witnessed_level" bigint,
    "best_parent" text,
    "is_on_mc" numeric,
    CONSTRAINT wtransid_pkey PRIMARY KEY (wtransid)
)
WITH (
    OIDS = FALSE
)
TABLESPACE pg_default;
CREATE UNIQUE INDEX witness_hash_index
    ON public.trans_witness USING btree
    (hash)
    TABLESPACE pg_default;
```

## 创世表

```postgresql
-- Table: public.trans_genesis
 
-- DROP TABLE public.trans_genesis;
 
CREATE TABLE public.trans_genesis
(
    creatid bigserial,

    -- 所有类型共有的
    "hash" text NOT NULL,
    "type" numeric,
    "from" text,
    "previous" text,
    "exec_timestamp" bigint,
    "work" text,
    "signature" text,
    "level" bigint,
    "is_stable" numeric,
    "stable_index" bigint,
    "status" numeric,
    "mci" bigint,
    "mc_timestamp" bigint,
    "stable_timestamp" bigint,

    -- 普通交易和创始交易私有的
    "to" text,
    "amount" numeric,
    "data" text,
    "data_hash" text,

    CONSTRAINT creatid_pkey PRIMARY KEY (creatid)
)
WITH (
    OIDS = FALSE
)
TABLESPACE pg_default;
CREATE UNIQUE INDEX genesis_hash_index
    ON public.trans_witness USING btree
    (hash)
    TABLESPACE pg_default;
```

## 交易类型表

```postgresql
-- Table: public.trans_type
 
-- DROP TABLE public.trans_type;
 
CREATE TABLE public.trans_type
(
    trans_type bigserial,

    -- 所有类型共有的
    "hash" text NOT NULL,
    "type" numeric,

    CONSTRAINT trans_type_pkey PRIMARY KEY (trans_type)
)
WITH (
    OIDS = FALSE
)
TABLESPACE pg_default;
CREATE UNIQUE INDEX type_hash_index
    ON public.trans_witness USING btree
    (hash)
    TABLESPACE pg_default;
```

## parent表创建

```postgresql
-- Table: public.parents
 
-- DROP TABLE public.parents;
 
CREATE TABLE public.parents
(
    parents_id bigserial,
    item text NOT NULL,
    parent text,
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

## timestap表的创建

```
--Table: public.timestamp

    --DROP TABLE public.timestamp;

CREATE TABLE public.timestamp(
    timestamp numeric,
    type bigint,
    count numeric,
    CONSTRAINT timestamp_key PRIMARY KEY(timestamp)
)
WITH(
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
--Table: public.global

    --DROP TABLE public.global;

CREATE TABLE public.global(
    global_id bigserial,
    key text,
    value numeric,
    CONSTRAINT global_id_key PRIMARY KEY(global_id)
)
WITH(
    OIDS = FALSE
)
TABLESPACE pg_default;
```

