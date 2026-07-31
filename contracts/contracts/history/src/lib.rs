#![no_std]

use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, Address, Env, Symbol,
};

const DAY_IN_LEDGERS: u32 = 17280;
const INSTANCE_BUMP_AMOUNT: u32 = 30 * DAY_IN_LEDGERS;
const INSTANCE_LIFETIME_THRESHOLD: u32 = INSTANCE_BUMP_AMOUNT - DAY_IN_LEDGERS;
const PERSISTENT_BUMP_AMOUNT: u32 = 30 * DAY_IN_LEDGERS;
const PERSISTENT_LIFETIME_THRESHOLD: u32 = PERSISTENT_BUMP_AMOUNT - DAY_IN_LEDGERS;

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct TransactionRecord {
    pub record_id: u64,
    pub consumer: Address,
    pub provider: Address,
    pub endpoint_id: u64,
    pub amount: i128,
    pub platform_fee: i128,
    pub success: bool,
    pub stellar_tx_hash: Symbol,
    pub timestamp: u64,
    pub tokens_used: u32,
    pub latency_ms: u64,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ProviderStats {
    pub provider: Address,
    pub total_transactions: u64,
    pub total_earned: i128,
    pub successful_requests: u64,
    pub failed_requests: u64,
    pub average_latency: u64,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ConsumerStats {
    pub consumer: Address,
    pub total_spent: i128,
    pub total_requests: u64,
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
pub enum HistoryError {
    NotAuthorized = 1,
    RecordNotFound = 2,
}

#[contracttype]
pub enum DataKey {
    Admin,
    NextId,
    Record(u64),
    ProviderStats(Address),
    ConsumerStats(Address),
}

const RECORD_LIFETIME: u32 = 365 * DAY_IN_LEDGERS;
const RECORD_THRESHOLD: u32 = RECORD_LIFETIME - DAY_IN_LEDGERS;

fn extend_instance(env: &Env) {
    env.storage()
        .instance()
        .extend_ttl(INSTANCE_LIFETIME_THRESHOLD, INSTANCE_BUMP_AMOUNT);
}

fn extend_persistent(env: &Env, key: &DataKey, lifetime: u32, threshold: u32) {
    env.storage()
        .persistent()
        .extend_ttl(key, threshold, lifetime);
}

fn extend_record(env: &Env, key: &DataKey) {
    extend_persistent(env, key, RECORD_LIFETIME, RECORD_THRESHOLD);
}

fn extend_stats(env: &Env, key: &DataKey) {
    extend_persistent(env, key, PERSISTENT_BUMP_AMOUNT, PERSISTENT_LIFETIME_THRESHOLD);
}

fn get_admin(env: &Env) -> Address {
    env.storage()
        .instance()
        .get(&DataKey::Admin)
        .unwrap_or_else(|| panic!("not initialized"))
}

#[contract]
pub struct HistoryContract;

pub trait HistoryTrait {
    fn initialize(env: Env, admin: Address);

    fn record_transaction(env: Env, record: TransactionRecord) -> u64;

    fn get_transaction(env: Env, record_id: u64) -> TransactionRecord;

    fn get_provider_stats(env: Env, provider: Address) -> ProviderStats;

    fn get_consumer_stats(env: Env, consumer: Address) -> ConsumerStats;

    fn get_transaction_count(env: Env) -> u64;
}

#[contractimpl]
impl HistoryTrait for HistoryContract {
    fn initialize(env: Env, admin: Address) {
        admin.require_auth();

        if env.storage().instance().has(&DataKey::Admin) {
            panic!("already initialized");
        }

        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::NextId, &0u64);

        extend_instance(&env);
    }

    fn record_transaction(env: Env, record: TransactionRecord) -> u64 {
        let admin = get_admin(&env);
        admin.require_auth();
        extend_instance(&env);

        let next_id: u64 = env
            .storage()
            .instance()
            .get(&DataKey::NextId)
            .unwrap_or(0u64);

        let stored_record = TransactionRecord {
            record_id: next_id,
            ..record.clone()
        };

        let record_key = DataKey::Record(next_id);
        env.storage().persistent().set(&record_key, &stored_record);
        extend_record(&env, &record_key);

        let provider_key = DataKey::ProviderStats(record.provider.clone());
        let mut provider_stats: ProviderStats =
            env.storage().persistent().get(&provider_key).unwrap_or_else(|| {
                ProviderStats {
                    provider: record.provider.clone(),
                    total_transactions: 0,
                    total_earned: 0i128,
                    successful_requests: 0,
                    failed_requests: 0,
                    average_latency: 0,
                }
            });

        let prev_total_latency_sum =
            provider_stats.average_latency * provider_stats.total_transactions;

        provider_stats.total_transactions += 1;
        if record.success {
            provider_stats.successful_requests += 1;
            provider_stats.total_earned += record.amount - record.platform_fee;
        } else {
            provider_stats.failed_requests += 1;
        }

        provider_stats.average_latency = if provider_stats.total_transactions > 0 {
            (prev_total_latency_sum + record.latency_ms) / provider_stats.total_transactions
        } else {
            0
        };

        env.storage()
            .persistent()
            .set(&provider_key, &provider_stats);
        extend_stats(&env, &provider_key);

        let consumer_key = DataKey::ConsumerStats(record.consumer.clone());
        let mut consumer_stats: ConsumerStats =
            env.storage().persistent().get(&consumer_key).unwrap_or_else(|| {
                ConsumerStats {
                    consumer: record.consumer.clone(),
                    total_spent: 0i128,
                    total_requests: 0,
                }
            });

        consumer_stats.total_requests += 1;
        if record.success {
            consumer_stats.total_spent += record.amount;
        }

        env.storage()
            .persistent()
            .set(&consumer_key, &consumer_stats);
        extend_stats(&env, &consumer_key);

        env.storage().instance().set(&DataKey::NextId, &(next_id + 1));

        next_id
    }

    fn get_transaction(env: Env, record_id: u64) -> TransactionRecord {
        extend_instance(&env);
        let key = DataKey::Record(record_id);
        let record: TransactionRecord = env
            .storage()
            .persistent()
            .get(&key)
            .unwrap_or_else(|| panic!("RecordNotFound"));
        extend_record(&env, &key);
        record
    }

    fn get_provider_stats(env: Env, provider: Address) -> ProviderStats {
        extend_instance(&env);
        let key = DataKey::ProviderStats(provider.clone());
        let stats: ProviderStats =
            env.storage().persistent().get(&key).unwrap_or_else(|| {
                ProviderStats {
                    provider: provider.clone(),
                    total_transactions: 0,
                    total_earned: 0i128,
                    successful_requests: 0,
                    failed_requests: 0,
                    average_latency: 0,
                }
            });
        if stats.total_transactions > 0 {
            extend_stats(&env, &key);
        }
        stats
    }

    fn get_consumer_stats(env: Env, consumer: Address) -> ConsumerStats {
        extend_instance(&env);
        let key = DataKey::ConsumerStats(consumer.clone());
        let stats: ConsumerStats =
            env.storage().persistent().get(&key).unwrap_or_else(|| {
                ConsumerStats {
                    consumer: consumer.clone(),
                    total_spent: 0i128,
                    total_requests: 0,
                }
            });
        if stats.total_requests > 0 {
            extend_stats(&env, &key);
        }
        stats
    }

    fn get_transaction_count(env: Env) -> u64 {
        extend_instance(&env);
        env.storage()
            .instance()
            .get(&DataKey::NextId)
            .unwrap_or(0u64)
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::testutils::Address as _;

    fn setup() -> (Env, Address, Address) {
        let env = Env::default();
        env.mock_all_auths();

        let admin = Address::generate(&env);
        let contract_id = env.register(HistoryContract, {});
        let client = HistoryContractClient::new(&env, &contract_id);

        client.initialize(&admin);

        (env, admin, contract_id)
    }

    fn create_test_record(
        env: &Env,
        consumer: &Address,
        provider: &Address,
        amount: i128,
        success: bool,
    ) -> TransactionRecord {
        TransactionRecord {
            record_id: 0,
            consumer: consumer.clone(),
            provider: provider.clone(),
            endpoint_id: 1,
            amount,
            platform_fee: amount * 5 / 100,
            success,
            stellar_tx_hash: Symbol::new(env, "hash123"),
            timestamp: env.ledger().timestamp(),
            tokens_used: 500,
            latency_ms: 250,
        }
    }

    #[test]
    fn test_initialize() {
        let (env, admin, contract_id) = setup();

        let stored_admin: Address = env.as_contract(&contract_id, || {
            env.storage().instance().get(&DataKey::Admin).unwrap()
        });
        assert_eq!(stored_admin, admin);
    }

    #[test]
    #[should_panic(expected = "already initialized")]
    fn test_initialize_twice_panics() {
        let env = Env::default();
        env.mock_all_auths();

        let admin = Address::generate(&env);
        let contract_id = env.register(HistoryContract, {});
        let client = HistoryContractClient::new(&env, &contract_id);

        client.initialize(&admin);
        client.initialize(&admin);
    }

    #[test]
    fn test_record_transaction() {
        let (env, _admin, contract_id) = setup();
        let client = HistoryContractClient::new(&env, &contract_id);

        let consumer = Address::generate(&env);
        let provider = Address::generate(&env);
        let record = create_test_record(&env, &consumer, &provider, 10_000_000i128, true);

        let record_id = client.record_transaction(&record);
        assert_eq!(record_id, 0);

        let stored = client.get_transaction(&record_id);
        assert_eq!(stored.record_id, 0);
        assert_eq!(stored.consumer, consumer);
        assert_eq!(stored.provider, provider);
        assert_eq!(stored.amount, 10_000_000i128);
        assert!(stored.success);
    }

    #[test]
    fn test_record_multiple_transactions() {
        let (env, _admin, contract_id) = setup();
        let client = HistoryContractClient::new(&env, &contract_id);

        let consumer = Address::generate(&env);
        let provider = Address::generate(&env);

        let id0 = client.record_transaction(&create_test_record(
            &env,
            &consumer,
            &provider,
            10_000_000i128,
            true,
        ));
        let id1 = client.record_transaction(&create_test_record(
            &env,
            &consumer,
            &provider,
            20_000_000i128,
            true,
        ));
        let id2 = client.record_transaction(&create_test_record(
            &env,
            &consumer,
            &provider,
            5_000_000i128,
            false,
        ));

        assert_eq!(id0, 0);
        assert_eq!(id1, 1);
        assert_eq!(id2, 2);

        let count = client.get_transaction_count();
        assert_eq!(count, 3);
    }

    #[test]
    fn test_provider_stats_successful() {
        let (env, _admin, contract_id) = setup();
        let client = HistoryContractClient::new(&env, &contract_id);

        let consumer = Address::generate(&env);
        let provider = Address::generate(&env);

        let amount = 10_000_000i128;
        let fee = amount * 5 / 100;

        client.record_transaction(&create_test_record(&env, &consumer, &provider, amount, true));
        client.record_transaction(&create_test_record(&env, &consumer, &provider, amount, true));

        let stats = client.get_provider_stats(&provider);
        assert_eq!(stats.total_transactions, 2);
        assert_eq!(stats.successful_requests, 2);
        assert_eq!(stats.failed_requests, 0);
        assert_eq!(stats.total_earned, (amount - fee) * 2);
        assert_eq!(stats.average_latency, 250);
    }

    #[test]
    fn test_provider_stats_mixed() {
        let (env, _admin, contract_id) = setup();
        let client = HistoryContractClient::new(&env, &contract_id);

        let consumer = Address::generate(&env);
        let provider = Address::generate(&env);

        let amount = 10_000_000i128;
        let fee = amount * 5 / 100;

        client.record_transaction(&create_test_record(&env, &consumer, &provider, amount, true));
        client.record_transaction(&create_test_record(&env, &consumer, &provider, amount, false));

        let stats = client.get_provider_stats(&provider);
        assert_eq!(stats.total_transactions, 2);
        assert_eq!(stats.successful_requests, 1);
        assert_eq!(stats.failed_requests, 1);
        assert_eq!(stats.total_earned, amount - fee);
    }

    #[test]
    fn test_consumer_stats() {
        let (env, _admin, contract_id) = setup();
        let client = HistoryContractClient::new(&env, &contract_id);

        let consumer = Address::generate(&env);
        let provider = Address::generate(&env);

        let amount1 = 10_000_000i128;
        let amount2 = 20_000_000i128;

        client.record_transaction(&create_test_record(
            &env,
            &consumer,
            &provider,
            amount1,
            true,
        ));
        client.record_transaction(&create_test_record(
            &env,
            &consumer,
            &provider,
            amount2,
            true,
        ));
        client.record_transaction(&create_test_record(
            &env,
            &consumer,
            &provider,
            5_000_000i128,
            false,
        ));

        let stats = client.get_consumer_stats(&consumer);
        assert_eq!(stats.total_requests, 3);
        assert_eq!(stats.total_spent, amount1 + amount2);
    }

    #[test]
    fn test_get_nonexistent_provider_stats() {
        let (env, _admin, contract_id) = setup();
        let client = HistoryContractClient::new(&env, &contract_id);

        let bogus = Address::generate(&env);
        let stats = client.get_provider_stats(&bogus);
        assert_eq!(stats.total_transactions, 0);
        assert_eq!(stats.total_earned, 0i128);
    }

    #[test]
    fn test_get_nonexistent_consumer_stats() {
        let (env, _admin, contract_id) = setup();
        let client = HistoryContractClient::new(&env, &contract_id);

        let bogus = Address::generate(&env);
        let stats = client.get_consumer_stats(&bogus);
        assert_eq!(stats.total_requests, 0);
        assert_eq!(stats.total_spent, 0i128);
    }

    #[test]
    #[should_panic(expected = "RecordNotFound")]
    fn test_get_nonexistent_transaction_panics() {
        let (env, _admin, contract_id) = setup();
        let client = HistoryContractClient::new(&env, &contract_id);

        client.get_transaction(&999u64);
    }

    #[test]
    fn test_transaction_count_initially_zero() {
        let (env, _admin, contract_id) = setup();
        let client = HistoryContractClient::new(&env, &contract_id);

        assert_eq!(client.get_transaction_count(), 0);
    }

    #[test]
    fn test_average_latency_calculation() {
        let (env, _admin, contract_id) = setup();
        let client = HistoryContractClient::new(&env, &contract_id);

        let consumer = Address::generate(&env);
        let provider = Address::generate(&env);

        let mut record1 = create_test_record(&env, &consumer, &provider, 10_000_000i128, true);
        record1.latency_ms = 100;
        client.record_transaction(&record1);

        let mut record2 = create_test_record(&env, &consumer, &provider, 10_000_000i128, true);
        record2.latency_ms = 300;
        client.record_transaction(&record2);

        let stats = client.get_provider_stats(&provider);
        assert_eq!(stats.average_latency, 200);
    }

    #[test]
    fn test_record_preserves_fields() {
        let (env, _admin, contract_id) = setup();
        let client = HistoryContractClient::new(&env, &contract_id);

        let consumer = Address::generate(&env);
        let provider = Address::generate(&env);

        let mut record = create_test_record(&env, &consumer, &provider, 15_000_000i128, true);
        record.endpoint_id = 42;
        record.tokens_used = 1024;
        record.latency_ms = 500;
        record.stellar_tx_hash = Symbol::new(&env, "abc123def456");

        let id = client.record_transaction(&record);
        let stored = client.get_transaction(&id);

        assert_eq!(stored.endpoint_id, 42);
        assert_eq!(stored.tokens_used, 1024);
        assert_eq!(stored.latency_ms, 500);
        assert_eq!(stored.stellar_tx_hash, Symbol::new(&env, "abc123def456"));
        assert_eq!(stored.record_id, id);
    }

    #[test]
    fn test_separate_consumers_stats() {
        let (env, _admin, contract_id) = setup();
        let client = HistoryContractClient::new(&env, &contract_id);

        let consumer1 = Address::generate(&env);
        let consumer2 = Address::generate(&env);
        let provider = Address::generate(&env);

        client.record_transaction(&create_test_record(
            &env,
            &consumer1,
            &provider,
            10_000_000i128,
            true,
        ));
        client.record_transaction(&create_test_record(
            &env,
            &consumer2,
            &provider,
            20_000_000i128,
            true,
        ));

        let stats1 = client.get_consumer_stats(&consumer1);
        let stats2 = client.get_consumer_stats(&consumer2);

        assert_eq!(stats1.total_requests, 1);
        assert_eq!(stats1.total_spent, 10_000_000i128);
        assert_eq!(stats2.total_requests, 1);
        assert_eq!(stats2.total_spent, 20_000_000i128);
    }
}
