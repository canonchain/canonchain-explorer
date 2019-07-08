创建表 `sql` 语句如下

## 用法 

- postgresql
- UI： pgAdmin (https://www.pgadmin.org/)

### 账户表创建

```postgresql

CREATE TABLE public.accounts
(
    acc_id bigserial,
    account text NOT NULL,
    type smallint,
    balance numeric,
    transaction_count numeric,

    -- 合约相关的
    is_token_account boolean,
    is_has_token_assets boolean,
    is_has_token_trans boolean,
    is_has_intel_trans boolean,
    is_has_event_logs boolean,

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
    IS '余额';
COMMENT ON COLUMN public.accounts.transaction_count
    IS '交易数量，该账户相关的交易数量';

-- Index: balance_accid_index

-- DROP INDEX public.balance_accid_index;

CREATE INDEX balance_accid_index
    ON public.accounts USING btree
    (balance, acc_id)
    TABLESPACE pg_default;

CREATE INDEX accounts_account_index
    ON public.accounts USING btree
    (account)
    TABLESPACE pg_default;

```

 
## 账户的普通交易索引表

优化账户详情中，普通交易 列表的检索速度

```postgresql
 
CREATE TABLE public.account_index_trans
(
    index_trans_id bigserial,
    "account" text,
    "hash" text,
    "stable_index" bigint,

    CONSTRAINT index_trans_id_key PRIMARY KEY(index_trans_id)
)
WITH (
    OIDS = FALSE
)
TABLESPACE pg_default;
CREATE INDEX index_trans_acc_index_id
    ON public.account_index_trans USING btree
    (account, stable_index,index_trans_id)
    TABLESPACE pg_default;
CREATE INDEX index_trans_index_id
    ON public.account_index_trans USING btree
    (stable_index, index_trans_id)
    TABLESPACE pg_default;
CREATE INDEX index_trans_account
    ON public.account_index_trans USING btree
    (account )
    TABLESPACE pg_default;

```

## 账户的代币转账索引表

优化账户详情中，代币转账 列表的检索速度

```postgresql
 
CREATE TABLE public.account_index_transtoken
(
    index_transtoken_id bigserial,
    "account" text,
    "hash" text,
    "stable_index" bigint,

    CONSTRAINT index_transtoken_id_key PRIMARY KEY(index_transtoken_id)
)
WITH (
    OIDS = FALSE
)
TABLESPACE pg_default;
CREATE INDEX index_transtoken_acc_index_id
    ON public.account_index_transtoken USING btree
    (account, stable_index,index_transtoken_id)
    TABLESPACE pg_default;
CREATE INDEX index_transtoken_index_id
    ON public.account_index_transtoken USING btree
    (stable_index, index_transtoken_id)
    TABLESPACE pg_default;
CREATE INDEX index_transtoken_account
    ON public.account_index_transtoken USING btree
    (account )
    TABLESPACE pg_default;
```

## 账户的内部交易索引表

优化账户详情中，内部交易 列表的检索速度

```postgresql
 
CREATE TABLE public.account_index_transinternal
(
    index_transinternal_id bigserial,
    "account" text,
    "hash" text,
    "stable_index" bigint,

    CONSTRAINT index_transinternal_id_key PRIMARY KEY(index_transinternal_id)
)
WITH (
    OIDS = FALSE
)
TABLESPACE pg_default;

CREATE INDEX index_transinternal_acc_index_id
    ON public.account_index_transinternal USING btree
    (account, stable_index,index_transinternal_id)
    TABLESPACE pg_default;

CREATE INDEX index_transinternal_index_id
    ON public.account_index_transinternal USING btree
    (stable_index, index_transinternal_id)
    TABLESPACE pg_default;
    
CREATE INDEX index_transinternal_account
    ON public.account_index_transinternal USING btree
    ("account")
    TABLESPACE pg_default;

```

## 账户的事件日志索引表

优化账户详情中，事件日志 列表的检索速度

```postgresql
 
CREATE TABLE public.account_index_translog
(
    index_translog_id bigserial,
    "account" text,
    "hash" text,
    "stable_index" bigint,

    CONSTRAINT index_translog_id_key PRIMARY KEY(index_translog_id)
)
WITH (
    OIDS = FALSE
)
TABLESPACE pg_default;
CREATE INDEX index_translog_acc_index_id
    ON public.account_index_translog USING btree
    (account, stable_index,index_translog_id)
    TABLESPACE pg_default;
CREATE INDEX index_translog_index_id
    ON public.account_index_translog USING btree
    (stable_index, index_translog_id)
    TABLESPACE pg_default;
CREATE INDEX index_translog_id_account
    ON public.account_index_translog USING btree
    (account )
    TABLESPACE pg_default;
```

## 普通交易表

```postgresql
 
CREATE TABLE public.trans_normal
(
    pkid bigserial,

    -- 所有类型共有的
    "hash" text NOT NULL,
    "type" numeric,
    "from" text,
    "previous" text,
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

    -- 合约相关的
    is_event_log boolean,
    is_token_trans boolean,
    is_intel_trans boolean,

    --增加的
    from_state text,
    to_states text,

    CONSTRAINT pkid_pkey PRIMARY KEY (pkid)
)
WITH (
    OIDS = FALSE
)
TABLESPACE pg_default;

CREATE UNIQUE INDEX trans_normal_hash
    ON public.trans_normal USING btree
    (hash)
    TABLESPACE pg_default;

CREATE INDEX trans_normal_stable
    ON public.trans_normal USING btree
    (stable_index)
    TABLESPACE pg_default;

CREATE INDEX trans_normal_stable_id
    ON public.trans_normal USING btree
    (stable_index,pkid)
    TABLESPACE pg_default;

CREATE INDEX trans_normal_stable_id_hash
    ON public.trans_normal USING btree
    (stable_index,pkid,hash)
    TABLESPACE pg_default;
```

## 见证交易表(存创始hash的简要信息)

```postgresql

CREATE TABLE public.trans_witness
(
    wtransid bigserial,

    -- 所有类型共有的
    "hash" text NOT NULL,
    "type" numeric,
    "from" text,
    "previous" text,
    "links" text,
    "timestamp" bigint,
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
CREATE UNIQUE INDEX trans_witness_hash
    ON public.trans_witness USING btree
    (hash)
    TABLESPACE pg_default;

CREATE INDEX trans_witness_from
    ON public.trans_witness USING btree
    ("from")
    TABLESPACE pg_default;

CREATE INDEX trans_witness_stable
    ON public.trans_witness USING btree
    (stable_index)
    TABLESPACE pg_default;

CREATE INDEX trans_witness_stable_from
    ON public.trans_witness USING btree
    (stable_index,"from")
    TABLESPACE pg_default;

```

## 创世表

```postgresql

CREATE TABLE public.trans_genesis
(
    creatid bigserial,

    -- 所有类型共有的
    "hash" text NOT NULL,
    "type" numeric,
    "from" text,
    "previous" text,
    "timestamp" bigint,
    "signature" text,
    "level" bigint,
    "witnessed_level" bigint,
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

    --增加的
    "is_free" numeric,
    "is_on_mc" numeric,
    from_state text,
    to_states text,

    "gas_used" numeric,
    "log" text,
    "log_bloom" text,

    CONSTRAINT creatid_pkey PRIMARY KEY (creatid)
)
WITH (
    OIDS = FALSE
)
TABLESPACE pg_default;
CREATE UNIQUE INDEX trans_genesis_hash
    ON public.trans_genesis USING btree
    (hash)
    TABLESPACE pg_default;

```

## 交易类型表

```postgresql
 
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
CREATE UNIQUE INDEX trans_type_hash
    ON public.trans_type USING btree
    (hash)
    TABLESPACE pg_default;

```

## parent表创建

```postgresql
 
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

CREATE INDEX parents_item
    ON public.parents USING btree
    (item )
    TABLESPACE pg_default;
```

## timestap表的创建

```

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


CREATE INDEX timestamp_type
    ON public."timestamp" USING btree
    ("type")
    TABLESPACE pg_default;

CREATE INDEX timestamp_count
    ON public."timestamp" USING btree
    ("count")
    TABLESPACE pg_default;

CREATE INDEX timestamp_type_timestamp
    ON public."timestamp" USING btree
    ("type",timestamp)
    TABLESPACE pg_default;
```

## global

```

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

CREATE INDEX global_key
    ON public."global" USING btree
    ("key")
    TABLESPACE pg_default;

```

### witness_list

```postgresql

CREATE TABLE public.witness_list
(
    witness_id bigserial,
    account text NOT NULL,
    CONSTRAINT witness_account_pkid PRIMARY KEY (account)
)
WITH (
    OIDS = FALSE
)
TABLESPACE pg_default;

```

---


## 合约相关表

******************************************************************************

### contract | 合约表

```postgresql

CREATE TABLE public.contract
(
    contract_id bigserial,

    contract_account text,
    own_account text,
    born_unit text,
    token_name text,
    token_symbol text,
    CONSTRAINT contract_account_pkey PRIMARY KEY (contract_account)
)
WITH (
    OIDS = FALSE
)
TABLESPACE pg_default;

```

### contract_code | 合约代码表

```postgresql

CREATE TABLE public.contract_code
(
    contract_account text,
    code text,
    CONSTRAINT contract_code_account_pkey PRIMARY KEY (contract_account)
)
WITH (
    OIDS = FALSE
)
TABLESPACE pg_default;

```

### token | token表

```postgresql

CREATE TABLE public.token
(
    token_id bigserial,
    contract_account text,
    "mc_timestamp" bigint,
    token_name text,
    token_symbol text,
    token_precision smallint,
    token_total numeric,
    owner text,
    transaction_count numeric,
    account_count numeric,

    CONSTRAINT token_account_pkey PRIMARY KEY (contract_account)
)
WITH (
    OIDS = FALSE
)
TABLESPACE pg_default;

CREATE INDEX token_id
    ON public."token" USING btree
    ("token_id")
    TABLESPACE pg_default;

```

### trans_token | Token交易表

```postgresql

CREATE TABLE public.trans_token
(
    trans_token_id bigserial,

    "hash" text,
    "mc_timestamp" bigint,
    "stable_index" bigint,

    "from" text,
    "to" text,
    contract_account text,
    token_symbol text,
    token_name text,
    token_precision numeric,
    "amount" numeric,
    "gas" numeric,
    "gas_price" numeric,
    "gas_used" numeric,
    "input" text,
    CONSTRAINT trans_token_id_pkey PRIMARY KEY (trans_token_id)
)
WITH (
    OIDS = FALSE
)
TABLESPACE pg_default;

CREATE INDEX trans_token_hash
    ON public."trans_token" USING btree
    ("hash")
    TABLESPACE pg_default;

CREATE INDEX trans_token_stable
    ON public."trans_token" USING btree
    ("stable_index")
    TABLESPACE pg_default;

CREATE INDEX trans_token_contract
    ON public."trans_token" USING btree
    ("contract_account")
    TABLESPACE pg_default;

CREATE INDEX trans_token_contract_index
    ON public."trans_token" USING btree
    ("contract_account","stable_index")
    TABLESPACE pg_default;

CREATE INDEX trans_token_stable_id
    ON public."trans_token" USING btree
    ("stable_index","trans_token_id")
    TABLESPACE pg_default;

CREATE INDEX trans_token_stable_id_hash
    ON public."trans_token" USING btree
    ("stable_index","trans_token_id","hash")
    TABLESPACE pg_default;

```

### trans_internal | 内部交易表

```postgresql

CREATE TABLE public.trans_internal
(
    trans_internal_id bigserial,

    "hash" text,
    "mci" bigint,
    "mc_timestamp" bigint,
    "stable_index" bigint,

    "type" numeric,
    "call_type" text,
    "from" text,
    "to" text,
    "gas" numeric,
    "input" text,
    "value" numeric,

    "init" text,

    "contract_address_suicide" text,
    "refund_adderss" text,
    "balance" numeric,

    "gas_used" numeric,
    "output" text,
    "contract_address_create" text,
    "contract_address_create_code" text,

    "is_error" boolean,
    "error_msg" text,

    "subtraces" numeric,
    "trace_address" text,
    CONSTRAINT trans_internal_id_key PRIMARY KEY(trans_internal_id)
)
WITH (
    OIDS = FALSE
)
TABLESPACE pg_default;


CREATE INDEX trans_internal_hash
    ON public."trans_internal" USING btree
    ("hash")
    TABLESPACE pg_default;

CREATE INDEX trans_internal_stable
    ON public."trans_internal" USING btree
    ("stable_index")
    TABLESPACE pg_default;

CREATE INDEX trans_internal_stable_id
    ON public."trans_internal" USING btree
    ("stable_index","trans_internal_id")
    TABLESPACE pg_default;

CREATE INDEX trans_internal_stable_id_hash
    ON public."trans_internal" USING btree
    ("stable_index","trans_internal_id","hash")
    TABLESPACE pg_default;
```

### event_log | 事件日志表

```postgresql

CREATE TABLE public.event_log
(
    event_log_id bigserial,

    "hash" text,
    "mci" bigint,
    "mc_timestamp" bigint,
    "stable_index" bigint,
    
    "contract_address" text,
    "from" text,
    "to" text,
    "method" text,

    "address" text,
    "data" text,
    "topics" text,

    CONSTRAINT event_log_id_pkey PRIMARY KEY (event_log_id)
)
WITH (
    OIDS = FALSE
)
TABLESPACE pg_default;

CREATE INDEX event_log_hash
    ON public."event_log" USING btree
    ("hash")
    TABLESPACE pg_default;

CREATE INDEX event_log_stable_id
    ON public."event_log" USING btree
    ("stable_index","event_log_id")
    TABLESPACE pg_default;

CREATE INDEX event_log_stable_id_hash
    ON public."event_log" USING btree
    ("stable_index","event_log_id","hash")
    TABLESPACE pg_default;

```

### token_asset | Token资产表

```postgresql

CREATE TABLE public.token_asset
(
    token_asset_id bigserial,
    
    account text,
    contract_account text,
    account_contract_merger text,
    "name" text,
    symbol text,
    precision numeric,
    balance numeric,

    CONSTRAINT token_account_symbol_pkey PRIMARY KEY (account,contract_account)
)
WITH (
    OIDS = FALSE
)
TABLESPACE pg_default;


CREATE INDEX token_asset_account
    ON public."token_asset" USING btree
    ("account")
    TABLESPACE pg_default;


CREATE INDEX token_asset_id
    ON public."token_asset" USING btree
    ("token_asset_id")
    TABLESPACE pg_default;


CREATE INDEX token_asset_contract
    ON public."token_asset" USING btree
    ("contract_account")
    TABLESPACE pg_default;

CREATE INDEX token_asset_balance_id
    ON public."token_asset" USING btree
    ("balance","token_asset_id")
    TABLESPACE pg_default;

CREATE INDEX token_asset_contract_balance_id
    ON public."token_asset" USING btree
    ("contract_account","balance","token_asset_id")
    TABLESPACE pg_default;

```


### gas_price | Gas价格表

```postgresql

CREATE TABLE public.gas_price
(
    timestamp numeric,
    cheapest_gas_price text,
    median_gas_price text,
    highest_gas_price text,
    CONSTRAINT gas_price_timestamp_pkey PRIMARY KEY (timestamp)
)
WITH (
    OIDS = FALSE
)
TABLESPACE pg_default;

CREATE INDEX gas_price_timestamp
    ON public."gas_price" USING btree
    ("timestamp")
    TABLESPACE pg_default;
```

### api_keys | api_key表

```
CREATE TABLE public.api_keys
(
	email text,
	app_name text,
    apikey text ,
    create_timestamp bigint,
    constraint apikeys_pkey primary key (apikey)
)
WITH(
    oids = false
)
TABLESPACE pg_default;

CREATE INDEX api_keys_timestamp
    ON public."api_keys" USING btree
    ("create_timestamp")
    TABLESPACE pg_default;
```


## 映射相关的表

******************************************************************************

### ETH映射表

```postgresql

CREATE TABLE public.mapping_log
(
    mapping_log_id bigserial,
    timestamp bigint,
    tx text,
    eth_address text,
    czr_account text,
    value numeric,
    status smallint,
    CONSTRAINT mapping_log_pkey PRIMARY KEY (mapping_log_id)
)
WITH (
    OIDS = FALSE
)
TABLESPACE pg_default;

```