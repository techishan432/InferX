#![no_std]

use soroban_sdk::{contract, contracterror, contractimpl, contracttype, Address, Env};

const DAY_IN_LEDGERS: u32 = 17280;
const INSTANCE_BUMP_AMOUNT: u32 = 30 * DAY_IN_LEDGERS;
const INSTANCE_LIFETIME_THRESHOLD: u32 = INSTANCE_BUMP_AMOUNT - DAY_IN_LEDGERS;
const PERSISTENT_BUMP_AMOUNT: u32 = 30 * DAY_IN_LEDGERS;
const PERSISTENT_LIFETIME_THRESHOLD: u32 = PERSISTENT_BUMP_AMOUNT - DAY_IN_LEDGERS;

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum EscrowStatus {
    Created,
    Released,
    Refunded,
    Expired,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Escrow {
    pub escrow_id: u64,
    pub consumer: Address,
    pub provider: Address,
    pub endpoint_id: u64,
    pub amount: i128,
    pub platform_fee: i128,
    pub status: EscrowStatus,
    pub created_at: u64,
    pub expires_at: u64,
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
pub enum EscrowError {
    NotAuthorized = 1,
    EscrowNotFound = 2,
    EscrowNotActive = 3,
    EscrowExpired = 4,
    InsufficientFunds = 5,
    AlreadyProcessed = 6,
}

#[contracttype]
pub enum DataKey {
    Admin,
    NextId,
    FeeBps,
    PlatformBalance,
    Escrow(u64),
}

fn extend_instance(env: &Env) {
    env.storage()
        .instance()
        .extend_ttl(INSTANCE_LIFETIME_THRESHOLD, INSTANCE_BUMP_AMOUNT);
}

fn extend_persistent(env: &Env, key: &DataKey) {
    env.storage()
        .persistent()
        .extend_ttl(key, PERSISTENT_LIFETIME_THRESHOLD, PERSISTENT_BUMP_AMOUNT);
}

fn get_admin(env: &Env) -> Address {
    env.storage()
        .instance()
        .get(&DataKey::Admin)
        .unwrap_or_else(|| panic!("not initialized"))
}

#[contract]
pub struct EscrowContract;

pub trait EscrowTrait {
    fn initialize(env: Env, admin: Address, platform_fee_bps: u32);

    fn create_escrow(
        env: Env,
        consumer: Address,
        provider: Address,
        endpoint_id: u64,
        amount: i128,
        token: Address,
        duration_seconds: u64,
    ) -> u64;

    fn release_payment(env: Env, escrow_id: u64, token: Address);

    fn refund_consumer(env: Env, escrow_id: u64, token: Address);

    fn expire_escrow(env: Env, escrow_id: u64, token: Address);

    fn get_escrow(env: Env, escrow_id: u64) -> Escrow;

    fn get_platform_balance(env: Env) -> i128;
}

#[contractimpl]
impl EscrowTrait for EscrowContract {
    fn initialize(env: Env, admin: Address, platform_fee_bps: u32) {
        admin.require_auth();

        if env.storage().instance().has(&DataKey::Admin) {
            panic!("already initialized");
        }

        if platform_fee_bps > 10_000 {
            panic!("fee too high");
        }

        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::NextId, &0u64);
        env.storage().instance().set(&DataKey::FeeBps, &platform_fee_bps);
        env.storage().instance().set(&DataKey::PlatformBalance, &0i128);

        extend_instance(&env);
    }

    fn create_escrow(
        env: Env,
        consumer: Address,
        provider: Address,
        endpoint_id: u64,
        amount: i128,
        token: Address,
        duration_seconds: u64,
    ) -> u64 {
        consumer.require_auth();
        extend_instance(&env);

        if amount <= 0 {
            panic!("InsufficientFunds");
        }

        let token_client = soroban_sdk::token::Client::new(&env, &token);
        token_client.transfer(&consumer, &env.current_contract_address(), &amount);

        let fee_bps: u32 = env
            .storage()
            .instance()
            .get(&DataKey::FeeBps)
            .unwrap_or(500u32);
        let platform_fee = amount * (fee_bps as i128) / 10_000i128;

        let next_id: u64 = env
            .storage()
            .instance()
            .get(&DataKey::NextId)
            .unwrap_or(0u64);

        let now = env.ledger().timestamp();
        let escrow = Escrow {
            escrow_id: next_id,
            consumer: consumer.clone(),
            provider: provider.clone(),
            endpoint_id,
            amount,
            platform_fee,
            status: EscrowStatus::Created,
            created_at: now,
            expires_at: now + duration_seconds,
        };

        let key = DataKey::Escrow(next_id);
        env.storage().persistent().set(&key, &escrow);
        extend_persistent(&env, &key);

        env.storage().instance().set(&DataKey::NextId, &(next_id + 1));

        next_id
    }

    fn release_payment(env: Env, escrow_id: u64, token: Address) {
        let admin = get_admin(&env);
        admin.require_auth();
        extend_instance(&env);

        let key = DataKey::Escrow(escrow_id);
        let mut escrow: Escrow = env
            .storage()
            .persistent()
            .get(&key)
            .unwrap_or_else(|| panic!("EscrowNotFound"));

        if escrow.status != EscrowStatus::Created {
            panic!("AlreadyProcessed");
        }

        let now = env.ledger().timestamp();
        if now > escrow.expires_at {
            panic!("EscrowExpired");
        }

        escrow.status = EscrowStatus::Released;
        env.storage().persistent().set(&key, &escrow);
        extend_persistent(&env, &key);

        let provider_amount = escrow.amount - escrow.platform_fee;

        let token_client = soroban_sdk::token::Client::new(&env, &token);
        token_client.transfer(
            &env.current_contract_address(),
            &escrow.provider,
            &provider_amount,
        );

        let current_balance: i128 = env
            .storage()
            .instance()
            .get(&DataKey::PlatformBalance)
            .unwrap_or(0i128);
        env.storage()
            .instance()
            .set(&DataKey::PlatformBalance, &(current_balance + escrow.platform_fee));
    }

    fn refund_consumer(env: Env, escrow_id: u64, token: Address) {
        let admin = get_admin(&env);
        admin.require_auth();
        extend_instance(&env);

        let key = DataKey::Escrow(escrow_id);
        let mut escrow: Escrow = env
            .storage()
            .persistent()
            .get(&key)
            .unwrap_or_else(|| panic!("EscrowNotFound"));

        if escrow.status != EscrowStatus::Created {
            panic!("AlreadyProcessed");
        }

        escrow.status = EscrowStatus::Refunded;
        env.storage().persistent().set(&key, &escrow);
        extend_persistent(&env, &key);

        let token_client = soroban_sdk::token::Client::new(&env, &token);
        token_client.transfer(
            &env.current_contract_address(),
            &escrow.consumer,
            &escrow.amount,
        );
    }

    fn expire_escrow(env: Env, escrow_id: u64, token: Address) {
        extend_instance(&env);

        let key = DataKey::Escrow(escrow_id);
        let mut escrow: Escrow = env
            .storage()
            .persistent()
            .get(&key)
            .unwrap_or_else(|| panic!("EscrowNotFound"));

        if escrow.status != EscrowStatus::Created {
            panic!("AlreadyProcessed");
        }

        let now = env.ledger().timestamp();
        if now <= escrow.expires_at {
            panic!("EscrowNotExpired");
        }

        escrow.status = EscrowStatus::Expired;
        env.storage().persistent().set(&key, &escrow);
        extend_persistent(&env, &key);

        let token_client = soroban_sdk::token::Client::new(&env, &token);
        token_client.transfer(
            &env.current_contract_address(),
            &escrow.consumer,
            &escrow.amount,
        );
    }

    fn get_escrow(env: Env, escrow_id: u64) -> Escrow {
        extend_instance(&env);
        let key = DataKey::Escrow(escrow_id);
        let escrow: Escrow = env
            .storage()
            .persistent()
            .get(&key)
            .unwrap_or_else(|| panic!("EscrowNotFound"));
        extend_persistent(&env, &key);
        escrow
    }

    fn get_platform_balance(env: Env) -> i128 {
        extend_instance(&env);
        env.storage()
            .instance()
            .get(&DataKey::PlatformBalance)
            .unwrap_or(0i128)
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::testutils::{Address as _, Ledger};
    use soroban_sdk::token;

    const ONE_XLM: i128 = 10_000_000;

    fn setup() -> (Env, Address, Address, Address, Address, Address) {
        let env = Env::default();
        env.mock_all_auths();

        let admin = Address::generate(&env);
        let consumer = Address::generate(&env);
        let provider = Address::generate(&env);

        let token_id = env.register_stellar_asset_contract_v2(admin.clone()).address();
        let contract_id = env.register(EscrowContract, {});

        let client = EscrowContractClient::new(&env, &contract_id);
        client.initialize(&admin, &500u32);

        let token_admin = token::StellarAssetClient::new(&env, &token_id);
        token_admin.mint(&consumer, &(100 * ONE_XLM));

        (env, admin, consumer, provider, token_id, contract_id)
    }

    #[test]
    fn test_initialize() {
        let (env, admin, _, _, _, contract_id) = setup();

        let stored_admin: Address = env.as_contract(&contract_id, || {
            env.storage().instance().get(&DataKey::Admin).unwrap()
        });
        assert_eq!(stored_admin, admin);

        let stored_fee: u32 = env.as_contract(&contract_id, || {
            env.storage().instance().get(&DataKey::FeeBps).unwrap()
        });
        assert_eq!(stored_fee, 500u32);
    }

    #[test]
    #[should_panic(expected = "already initialized")]
    fn test_initialize_twice_panics() {
        let env = Env::default();
        env.mock_all_auths();

        let admin = Address::generate(&env);
        let contract_id = env.register(EscrowContract, {});
        let client = EscrowContractClient::new(&env, &contract_id);

        client.initialize(&admin, &500u32);
        client.initialize(&admin, &500u32);
    }

    #[test]
    fn test_create_escrow() {
        let (env, _admin, consumer, provider, token_id, contract_id) = setup();
        let client = EscrowContractClient::new(&env, &contract_id);

        let amount = 10 * ONE_XLM;
        let duration = 3600u64;

        let escrow_id = client.create_escrow(
            &consumer,
            &provider,
            &1u64,
            &amount,
            &token_id,
            &duration,
        );

        assert_eq!(escrow_id, 0);

        let escrow = client.get_escrow(&escrow_id);
        assert_eq!(escrow.consumer, consumer);
        assert_eq!(escrow.provider, provider);
        assert_eq!(escrow.endpoint_id, 1);
        assert_eq!(escrow.amount, amount);
        assert_eq!(escrow.platform_fee, amount * 500 / 10_000);
        assert_eq!(escrow.status, EscrowStatus::Created);
    }

    #[test]
    fn test_release_payment() {
        let (env, _admin, consumer, provider, token_id, contract_id) = setup();
        let client = EscrowContractClient::new(&env, &contract_id);

        let amount = 10 * ONE_XLM;
        let escrow_id = client.create_escrow(
            &consumer,
            &provider,
            &1u64,
            &amount,
            &token_id,
            &3600u64,
        );

        let token_client = token::Client::new(&env, &token_id);

        let provider_bal_before = token_client.balance(&provider);
        client.release_payment(&escrow_id, &token_id);
        let provider_bal_after = token_client.balance(&provider);

        let expected_fee = amount * 500 / 10_000;
        let expected_provider_amount = amount - expected_fee;
        assert_eq!(provider_bal_after - provider_bal_before, expected_provider_amount);

        let escrow = client.get_escrow(&escrow_id);
        assert_eq!(escrow.status, EscrowStatus::Released);

        let platform_balance = client.get_platform_balance();
        assert_eq!(platform_balance, expected_fee);
    }

    #[test]
    fn test_refund_consumer() {
        let (env, _admin, consumer, provider, token_id, contract_id) = setup();
        let client = EscrowContractClient::new(&env, &contract_id);

        let amount = 10 * ONE_XLM;
        let escrow_id = client.create_escrow(
            &consumer,
            &provider,
            &1u64,
            &amount,
            &token_id,
            &3600u64,
        );

        let token_client = token::Client::new(&env, &token_id);
        let consumer_bal_before = token_client.balance(&consumer);

        client.refund_consumer(&escrow_id, &token_id);

        let consumer_bal_after = token_client.balance(&consumer);
        assert_eq!(consumer_bal_after - consumer_bal_before, amount);

        let escrow = client.get_escrow(&escrow_id);
        assert_eq!(escrow.status, EscrowStatus::Refunded);
    }

    #[test]
    fn test_expire_escrow() {
        let (env, _admin, consumer, provider, token_id, contract_id) = setup();
        let client = EscrowContractClient::new(&env, &contract_id);

        let amount = 10 * ONE_XLM;
        let escrow_id = client.create_escrow(
            &consumer,
            &provider,
            &1u64,
            &amount,
            &token_id,
            &100u64,
        );

        env.ledger().with_mut(|li| {
            li.timestamp = li.timestamp + 200;
        });

        let token_client = token::Client::new(&env, &token_id);
        let consumer_bal_before = token_client.balance(&consumer);

        client.expire_escrow(&escrow_id, &token_id);

        let consumer_bal_after = token_client.balance(&consumer);
        assert_eq!(consumer_bal_after - consumer_bal_before, amount);

        let escrow = client.get_escrow(&escrow_id);
        assert_eq!(escrow.status, EscrowStatus::Expired);
    }

    #[test]
    #[should_panic(expected = "AlreadyProcessed")]
    fn test_release_already_released_panics() {
        let (env, _admin, consumer, provider, token_id, contract_id) = setup();
        let client = EscrowContractClient::new(&env, &contract_id);

        let amount = 10 * ONE_XLM;
        let escrow_id = client.create_escrow(
            &consumer,
            &provider,
            &1u64,
            &amount,
            &token_id,
            &3600u64,
        );

        client.release_payment(&escrow_id, &token_id);
        client.release_payment(&escrow_id, &token_id);
    }

    #[test]
    #[should_panic(expected = "EscrowExpired")]
    fn test_release_expired_escrow_panics() {
        let (env, _admin, consumer, provider, token_id, contract_id) = setup();
        let client = EscrowContractClient::new(&env, &contract_id);

        let amount = 10 * ONE_XLM;
        let escrow_id = client.create_escrow(
            &consumer,
            &provider,
            &1u64,
            &amount,
            &token_id,
            &100u64,
        );

        env.ledger().with_mut(|li| {
            li.timestamp = li.timestamp + 200;
        });

        client.release_payment(&escrow_id, &token_id);
    }

    #[test]
    #[should_panic(expected = "EscrowNotExpired")]
    fn test_expire_not_expired_panics() {
        let (env, _admin, consumer, provider, token_id, contract_id) = setup();
        let client = EscrowContractClient::new(&env, &contract_id);

        let amount = 10 * ONE_XLM;
        let escrow_id = client.create_escrow(
            &consumer,
            &provider,
            &1u64,
            &amount,
            &token_id,
            &3600u64,
        );

        client.expire_escrow(&escrow_id, &token_id);
    }

    #[test]
    fn test_multiple_escrows() {
        let (env, _admin, consumer, provider, token_id, contract_id) = setup();
        let client = EscrowContractClient::new(&env, &contract_id);

        let amount = 5 * ONE_XLM;

        let id0 = client.create_escrow(
            &consumer,
            &provider,
            &1u64,
            &amount,
            &token_id,
            &3600u64,
        );
        let id1 = client.create_escrow(
            &consumer,
            &provider,
            &2u64,
            &amount,
            &token_id,
            &3600u64,
        );

        assert_eq!(id0, 0);
        assert_eq!(id1, 1);

        let escrow0 = client.get_escrow(&id0);
        let escrow1 = client.get_escrow(&id1);
        assert_eq!(escrow0.endpoint_id, 1);
        assert_eq!(escrow1.endpoint_id, 2);
    }

    #[test]
    #[should_panic(expected = "InsufficientFunds")]
    fn test_create_escrow_zero_amount_panics() {
        let (env, _admin, consumer, provider, token_id, contract_id) = setup();
        let client = EscrowContractClient::new(&env, &contract_id);

        client.create_escrow(
            &consumer,
            &provider,
            &1u64,
            &0i128,
            &token_id,
            &3600u64,
        );
    }

    #[test]
    #[should_panic(expected = "EscrowNotFound")]
    fn test_get_nonexistent_escrow_panics() {
        let (env, _admin, _consumer, _provider, _token_id, contract_id) = setup();
        let client = EscrowContractClient::new(&env, &contract_id);

        client.get_escrow(&999u64);
    }

    #[test]
    fn test_platform_fee_calculation() {
        let (env, _admin, consumer, provider, token_id, contract_id) = setup();
        let client = EscrowContractClient::new(&env, &contract_id);

        let amount = 100 * ONE_XLM;
        let escrow_id = client.create_escrow(
            &consumer,
            &provider,
            &1u64,
            &amount,
            &token_id,
            &3600u64,
        );

        let escrow = client.get_escrow(&escrow_id);
        let expected_fee = amount * 500 / 10_000;
        assert_eq!(escrow.platform_fee, expected_fee);
        assert_eq!(expected_fee, 5 * ONE_XLM);
    }
}
