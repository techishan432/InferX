#![no_std]

use soroban_sdk::{contract, contracterror, contractimpl, contracttype, Address, Env, Symbol};

const DAY_IN_LEDGERS: u32 = 17280;
const INSTANCE_BUMP_AMOUNT: u32 = 30 * DAY_IN_LEDGERS;
const INSTANCE_LIFETIME_THRESHOLD: u32 = INSTANCE_BUMP_AMOUNT - DAY_IN_LEDGERS;
const PERSISTENT_BUMP_AMOUNT: u32 = 30 * DAY_IN_LEDGERS;
const PERSISTENT_LIFETIME_THRESHOLD: u32 = PERSISTENT_BUMP_AMOUNT - DAY_IN_LEDGERS;

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ProviderInfo {
    pub address: Address,
    pub name: Symbol,
    pub description: Symbol,
    pub is_active: bool,
    pub registered_at: u64,
    pub total_endpoints: u32,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct EndpointInfo {
    pub endpoint_id: u64,
    pub provider: Address,
    pub model_name: Symbol,
    pub price_per_request: i128,
    pub max_input_tokens: u32,
    pub max_output_tokens: u32,
    pub context_length: u32,
    pub supports_vision: bool,
    pub supports_streaming: bool,
    pub is_active: bool,
    pub rate_limit: u32,
    pub created_at: u64,
    pub latency_ms: u64,
    pub location: Symbol,
    pub total_requests: u64,
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
pub enum RegistryError {
    NotAuthorized = 1,
    ProviderNotFound = 2,
    EndpointNotFound = 3,
    EndpointNotActive = 4,
    ProviderAlreadyRegistered = 5,
    ProviderNotActive = 6,
}

#[contracttype]
pub enum DataKey {
    Admin,
    NextEndpointId,
    Provider(Address),
    Endpoint(u64),
    ActiveCount(Address),
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

#[contract]
pub struct RegistryContract;

pub trait RegistryTrait {
    fn initialize(env: Env, admin: Address);

    fn register_provider(
        env: Env,
        provider: Address,
        name: Symbol,
        description: Symbol,
    );

    fn update_provider(
        env: Env,
        provider: Address,
        name: Symbol,
        description: Symbol,
    );

    fn deactivate_provider(env: Env, provider: Address);

    fn activate_provider(env: Env, provider: Address);

    fn register_endpoint(
        env: Env,
        provider: Address,
        endpoint: EndpointInfo,
    ) -> u64;

    fn update_endpoint(
        env: Env,
        provider: Address,
        endpoint_id: u64,
        endpoint: EndpointInfo,
    );

    fn deactivate_endpoint(env: Env, provider: Address, endpoint_id: u64);

    fn activate_endpoint(env: Env, provider: Address, endpoint_id: u64);

    fn get_provider(env: Env, provider: Address) -> ProviderInfo;

    fn get_endpoint(env: Env, endpoint_id: u64) -> Option<EndpointInfo>;

    fn get_active_endpoints_count(env: Env, provider: Address) -> u32;

    fn increment_request_count(env: Env, endpoint_id: u64);
}

#[contractimpl]
impl RegistryTrait for RegistryContract {
    fn initialize(env: Env, admin: Address) {
        admin.require_auth();

        if env.storage().instance().has(&DataKey::Admin) {
            panic!("already initialized");
        }

        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::NextEndpointId, &0u64);

        extend_instance(&env);
    }

    fn register_provider(
        env: Env,
        provider: Address,
        name: Symbol,
        description: Symbol,
    ) {
        provider.require_auth();
        extend_instance(&env);

        let key = DataKey::Provider(provider.clone());
        if env.storage().persistent().has(&key) {
            panic!("ProviderAlreadyRegistered");
        }

        let info = ProviderInfo {
            address: provider.clone(),
            name,
            description,
            is_active: true,
            registered_at: env.ledger().timestamp(),
            total_endpoints: 0,
        };

        env.storage().persistent().set(&key, &info);
        env.storage()
            .persistent()
            .set(&DataKey::ActiveCount(provider.clone()), &0u32);

        extend_persistent(&env, &key);
        extend_persistent(&env, &DataKey::ActiveCount(provider));
    }

    fn update_provider(
        env: Env,
        provider: Address,
        name: Symbol,
        description: Symbol,
    ) {
        provider.require_auth();
        extend_instance(&env);

        let key = DataKey::Provider(provider.clone());
        let mut info: ProviderInfo = env
            .storage()
            .persistent()
            .get(&key)
            .unwrap_or_else(|| panic!("ProviderNotFound"));

        info.name = name;
        info.description = description;

        env.storage().persistent().set(&key, &info);
        extend_persistent(&env, &key);
    }

    fn deactivate_provider(env: Env, provider: Address) {
        provider.require_auth();
        extend_instance(&env);

        let key = DataKey::Provider(provider.clone());
        let mut info: ProviderInfo = env
            .storage()
            .persistent()
            .get(&key)
            .unwrap_or_else(|| panic!("ProviderNotFound"));

        info.is_active = false;

        env.storage().persistent().set(&key, &info);
        extend_persistent(&env, &key);
    }

    fn activate_provider(env: Env, provider: Address) {
        provider.require_auth();
        extend_instance(&env);

        let key = DataKey::Provider(provider.clone());
        let mut info: ProviderInfo = env
            .storage()
            .persistent()
            .get(&key)
            .unwrap_or_else(|| panic!("ProviderNotFound"));

        info.is_active = true;

        env.storage().persistent().set(&key, &info);
        extend_persistent(&env, &key);
    }

    fn register_endpoint(
        env: Env,
        provider: Address,
        endpoint: EndpointInfo,
    ) -> u64 {
        extend_instance(&env);

        let provider_key = DataKey::Provider(provider.clone());
        let provider_info: ProviderInfo = env
            .storage()
            .persistent()
            .get(&provider_key)
            .unwrap_or_else(|| panic!("ProviderNotFound"));

        if !provider_info.is_active {
            panic!("ProviderNotActive");
        }

        provider.require_auth();

        let next_id: u64 = env
            .storage()
            .instance()
            .get(&DataKey::NextEndpointId)
            .unwrap_or(0u64);

        let stored_endpoint = EndpointInfo {
            endpoint_id: next_id,
            provider: provider.clone(),
            created_at: env.ledger().timestamp(),
            total_requests: 0,
            model_name: endpoint.model_name,
            price_per_request: endpoint.price_per_request,
            max_input_tokens: endpoint.max_input_tokens,
            max_output_tokens: endpoint.max_output_tokens,
            context_length: endpoint.context_length,
            supports_vision: endpoint.supports_vision,
            supports_streaming: endpoint.supports_streaming,
            is_active: endpoint.is_active,
            rate_limit: endpoint.rate_limit,
            latency_ms: endpoint.latency_ms,
            location: endpoint.location,
        };

        env.storage()
            .instance()
            .set(&DataKey::NextEndpointId, &(next_id + 1));

        let ep_key = DataKey::Endpoint(next_id);
        env.storage().persistent().set(&ep_key, &stored_endpoint);
        extend_persistent(&env, &ep_key);

        if stored_endpoint.is_active {
            let count_key = DataKey::ActiveCount(provider.clone());
            let count: u32 = env.storage().persistent().get(&count_key).unwrap_or(0u32);
            env.storage().persistent().set(&count_key, &(count + 1));
            extend_persistent(&env, &count_key);
        }

        let mut updated_provider = provider_info;
        updated_provider.total_endpoints += 1;
        env.storage().persistent().set(&provider_key, &updated_provider);
        extend_persistent(&env, &provider_key);

        next_id
    }

    fn update_endpoint(
        env: Env,
        provider: Address,
        endpoint_id: u64,
        endpoint: EndpointInfo,
    ) {
        provider.require_auth();
        extend_instance(&env);

        let ep_key = DataKey::Endpoint(endpoint_id);
        let old_ep: EndpointInfo = env
            .storage()
            .persistent()
            .get(&ep_key)
            .unwrap_or_else(|| panic!("EndpointNotFound"));

        if old_ep.provider != provider {
            panic!("NotAuthorized");
        }

        let count_key = DataKey::ActiveCount(provider.clone());
        let count: u32 = env.storage().persistent().get(&count_key).unwrap_or(0u32);

        let new_count = match (old_ep.is_active, endpoint.is_active) {
            (true, false) => count.saturating_sub(1),
            (false, true) => count + 1,
            _ => count,
        };
        env.storage().persistent().set(&count_key, &new_count);
        extend_persistent(&env, &count_key);

        let stored_ep = EndpointInfo {
            endpoint_id,
            provider: provider.clone(),
            created_at: old_ep.created_at,
            total_requests: old_ep.total_requests,
            ..endpoint
        };

        env.storage().persistent().set(&ep_key, &stored_ep);
        extend_persistent(&env, &ep_key);
    }

    fn deactivate_endpoint(env: Env, provider: Address, endpoint_id: u64) {
        provider.require_auth();
        extend_instance(&env);

        let ep_key = DataKey::Endpoint(endpoint_id);
        let mut ep: EndpointInfo = env
            .storage()
            .persistent()
            .get(&ep_key)
            .unwrap_or_else(|| panic!("EndpointNotFound"));

        if ep.provider != provider {
            panic!("NotAuthorized");
        }

        if ep.is_active {
            ep.is_active = false;
            env.storage().persistent().set(&ep_key, &ep);
            extend_persistent(&env, &ep_key);

            let count_key = DataKey::ActiveCount(provider.clone());
            let count: u32 = env.storage().persistent().get(&count_key).unwrap_or(0u32);
            env.storage()
                .persistent()
                .set(&count_key, &count.saturating_sub(1));
            extend_persistent(&env, &count_key);
        }
    }

    fn activate_endpoint(env: Env, provider: Address, endpoint_id: u64) {
        provider.require_auth();
        extend_instance(&env);

        let ep_key = DataKey::Endpoint(endpoint_id);
        let mut ep: EndpointInfo = env
            .storage()
            .persistent()
            .get(&ep_key)
            .unwrap_or_else(|| panic!("EndpointNotFound"));

        if ep.provider != provider {
            panic!("NotAuthorized");
        }

        if !ep.is_active {
            let provider_key = DataKey::Provider(provider.clone());
            let provider_info: ProviderInfo = env
                .storage()
                .persistent()
                .get(&provider_key)
                .unwrap_or_else(|| panic!("ProviderNotFound"));

            if !provider_info.is_active {
                panic!("ProviderNotActive");
            }

            ep.is_active = true;
            env.storage().persistent().set(&ep_key, &ep);
            extend_persistent(&env, &ep_key);

            let count_key = DataKey::ActiveCount(provider.clone());
            let count: u32 = env.storage().persistent().get(&count_key).unwrap_or(0u32);
            env.storage().persistent().set(&count_key, &(count + 1));
            extend_persistent(&env, &count_key);
        }
    }

    fn get_provider(env: Env, provider: Address) -> ProviderInfo {
        extend_instance(&env);
        let key = DataKey::Provider(provider.clone());
        let info: ProviderInfo = env
            .storage()
            .persistent()
            .get(&key)
            .unwrap_or_else(|| panic!("ProviderNotFound"));
        extend_persistent(&env, &key);
        info
    }

    fn get_endpoint(env: Env, endpoint_id: u64) -> Option<EndpointInfo> {
        extend_instance(&env);
        let key = DataKey::Endpoint(endpoint_id);
        let ep: Option<EndpointInfo> = env.storage().persistent().get(&key);
        if ep.is_some() {
            extend_persistent(&env, &key);
        }
        ep
    }

    fn get_active_endpoints_count(env: Env, provider: Address) -> u32 {
        extend_instance(&env);
        let count_key = DataKey::ActiveCount(provider.clone());
        let count: u32 = env.storage().persistent().get(&count_key).unwrap_or(0u32);
        extend_persistent(&env, &count_key);
        count
    }

    fn increment_request_count(env: Env, endpoint_id: u64) {
        let admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .unwrap_or_else(|| panic!("not initialized"));
        admin.require_auth();
        extend_instance(&env);

        let ep_key = DataKey::Endpoint(endpoint_id);
        let mut ep: EndpointInfo = env
            .storage()
            .persistent()
            .get(&ep_key)
            .unwrap_or_else(|| panic!("EndpointNotFound"));

        ep.total_requests += 1;

        env.storage().persistent().set(&ep_key, &ep);
        extend_persistent(&env, &ep_key);
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::testutils::Address as _;

    fn create_test_endpoint(env: &Env, provider: &Address) -> EndpointInfo {
        EndpointInfo {
            endpoint_id: 0,
            provider: provider.clone(),
            model_name: Symbol::new(env, "llama_3_8b"),
            price_per_request: 100_000,
            max_input_tokens: 4096,
            max_output_tokens: 2048,
            context_length: 8192,
            supports_vision: false,
            supports_streaming: true,
            is_active: true,
            rate_limit: 100,
            created_at: 0,
            latency_ms: 250,
            location: Symbol::new(env, "us_east_1"),
            total_requests: 0,
        }
    }

    #[test]
    fn test_initialize() {
        let env = Env::default();
        env.mock_all_auths();

        let admin = Address::generate(&env);
        let contract_id = env.register(RegistryContract, {});
        let client = RegistryContractClient::new(&env, &contract_id);

        client.initialize(&admin);

        let stored_admin: Address = env
            .as_contract(&contract_id, || {
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
        let contract_id = env.register(RegistryContract, {});
        let client = RegistryContractClient::new(&env, &contract_id);

        client.initialize(&admin);
        client.initialize(&admin);
    }

    #[test]
    fn test_register_provider() {
        let env = Env::default();
        env.mock_all_auths();

        let admin = Address::generate(&env);
        let provider = Address::generate(&env);
        let contract_id = env.register(RegistryContract, {});
        let client = RegistryContractClient::new(&env, &contract_id);

        client.initialize(&admin);
        client.register_provider(
            &provider,
            &Symbol::new(&env, "TestProvider"),
            &Symbol::new(&env, "Atestprovider"),
        );

        let info = client.get_provider(&provider);
        assert_eq!(info.address, provider);
        assert_eq!(info.name, Symbol::new(&env, "TestProvider"));
        assert_eq!(info.description, Symbol::new(&env, "Atestprovider"));
        assert!(info.is_active);
        assert_eq!(info.total_endpoints, 0);
    }

    #[test]
    #[should_panic(expected = "ProviderAlreadyRegistered")]
    fn test_register_provider_twice_panics() {
        let env = Env::default();
        env.mock_all_auths();

        let admin = Address::generate(&env);
        let provider = Address::generate(&env);
        let contract_id = env.register(RegistryContract, {});
        let client = RegistryContractClient::new(&env, &contract_id);

        client.initialize(&admin);
        client.register_provider(
            &provider,
            &Symbol::new(&env, "TestProvider"),
            &Symbol::new(&env, "desc"),
        );
        client.register_provider(
            &provider,
            &Symbol::new(&env, "TestProvider"),
            &Symbol::new(&env, "desc"),
        );
    }

    #[test]
    fn test_update_provider() {
        let env = Env::default();
        env.mock_all_auths();

        let admin = Address::generate(&env);
        let provider = Address::generate(&env);
        let contract_id = env.register(RegistryContract, {});
        let client = RegistryContractClient::new(&env, &contract_id);

        client.initialize(&admin);
        client.register_provider(
            &provider,
            &Symbol::new(&env, "OldName"),
            &Symbol::new(&env, "OldDesc"),
        );
        client.update_provider(
            &provider,
            &Symbol::new(&env, "NewName"),
            &Symbol::new(&env, "NewDesc"),
        );

        let info = client.get_provider(&provider);
        assert_eq!(info.name, Symbol::new(&env, "NewName"));
        assert_eq!(info.description, Symbol::new(&env, "NewDesc"));
    }

    #[test]
    fn test_deactivate_and_activate_provider() {
        let env = Env::default();
        env.mock_all_auths();

        let admin = Address::generate(&env);
        let provider = Address::generate(&env);
        let contract_id = env.register(RegistryContract, {});
        let client = RegistryContractClient::new(&env, &contract_id);

        client.initialize(&admin);
        client.register_provider(
            &provider,
            &Symbol::new(&env, "Provider"),
            &Symbol::new(&env, "desc"),
        );

        client.deactivate_provider(&provider);
        let info = client.get_provider(&provider);
        assert!(!info.is_active);

        client.activate_provider(&provider);
        let info = client.get_provider(&provider);
        assert!(info.is_active);
    }

    #[test]
    fn test_register_endpoint() {
        let env = Env::default();
        env.mock_all_auths();

        let admin = Address::generate(&env);
        let provider = Address::generate(&env);
        let contract_id = env.register(RegistryContract, {});
        let client = RegistryContractClient::new(&env, &contract_id);

        client.initialize(&admin);
        client.register_provider(
            &provider,
            &Symbol::new(&env, "Provider"),
            &Symbol::new(&env, "desc"),
        );

        let ep = create_test_endpoint(&env, &provider);
        let ep_id = client.register_endpoint(&provider, &ep);

        assert_eq!(ep_id, 0);

        let stored_ep = client.get_endpoint(&ep_id).unwrap();
        assert_eq!(stored_ep.endpoint_id, 0);
        assert_eq!(stored_ep.provider, provider);
        assert_eq!(stored_ep.model_name, Symbol::new(&env, "llama_3_8b"));
        assert_eq!(stored_ep.price_per_request, 100_000);
        assert!(stored_ep.is_active);
        assert_eq!(stored_ep.total_requests, 0);

        let count = client.get_active_endpoints_count(&provider);
        assert_eq!(count, 1);

        let provider_info = client.get_provider(&provider);
        assert_eq!(provider_info.total_endpoints, 1);
    }

    #[test]
    fn test_register_multiple_endpoints() {
        let env = Env::default();
        env.mock_all_auths();

        let admin = Address::generate(&env);
        let provider = Address::generate(&env);
        let contract_id = env.register(RegistryContract, {});
        let client = RegistryContractClient::new(&env, &contract_id);

        client.initialize(&admin);
        client.register_provider(
            &provider,
            &Symbol::new(&env, "Provider"),
            &Symbol::new(&env, "desc"),
        );

        let id0 = client.register_endpoint(&provider, &create_test_endpoint(&env, &provider));
        let id1 = client.register_endpoint(&provider, &create_test_endpoint(&env, &provider));
        let id2 = client.register_endpoint(&provider, &create_test_endpoint(&env, &provider));

        assert_eq!(id0, 0);
        assert_eq!(id1, 1);
        assert_eq!(id2, 2);

        let count = client.get_active_endpoints_count(&provider);
        assert_eq!(count, 3);

        let provider_info = client.get_provider(&provider);
        assert_eq!(provider_info.total_endpoints, 3);
    }

    #[test]
    fn test_update_endpoint() {
        let env = Env::default();
        env.mock_all_auths();

        let admin = Address::generate(&env);
        let provider = Address::generate(&env);
        let contract_id = env.register(RegistryContract, {});
        let client = RegistryContractClient::new(&env, &contract_id);

        client.initialize(&admin);
        client.register_provider(
            &provider,
            &Symbol::new(&env, "Provider"),
            &Symbol::new(&env, "desc"),
        );

        let ep_id = client.register_endpoint(&provider, &create_test_endpoint(&env, &provider));

        let mut updated = create_test_endpoint(&env, &provider);
        updated.price_per_request = 200_000;
        updated.rate_limit = 500;

        client.update_endpoint(&provider, &ep_id, &updated);

        let stored = client.get_endpoint(&ep_id).unwrap();
        assert_eq!(stored.price_per_request, 200_000);
        assert_eq!(stored.rate_limit, 500);
        assert_eq!(stored.created_at, stored.created_at);
    }

    #[test]
    fn test_deactivate_endpoint() {
        let env = Env::default();
        env.mock_all_auths();

        let admin = Address::generate(&env);
        let provider = Address::generate(&env);
        let contract_id = env.register(RegistryContract, {});
        let client = RegistryContractClient::new(&env, &contract_id);

        client.initialize(&admin);
        client.register_provider(
            &provider,
            &Symbol::new(&env, "Provider"),
            &Symbol::new(&env, "desc"),
        );
        let ep_id = client.register_endpoint(&provider, &create_test_endpoint(&env, &provider));

        assert_eq!(client.get_active_endpoints_count(&provider), 1);

        client.deactivate_endpoint(&provider, &ep_id);

        let stored = client.get_endpoint(&ep_id).unwrap();
        assert!(!stored.is_active);
        assert_eq!(client.get_active_endpoints_count(&provider), 0);
    }

    #[test]
    fn test_activate_endpoint() {
        let env = Env::default();
        env.mock_all_auths();

        let admin = Address::generate(&env);
        let provider = Address::generate(&env);
        let contract_id = env.register(RegistryContract, {});
        let client = RegistryContractClient::new(&env, &contract_id);

        client.initialize(&admin);
        client.register_provider(
            &provider,
            &Symbol::new(&env, "Provider"),
            &Symbol::new(&env, "desc"),
        );
        let ep_id = client.register_endpoint(&provider, &create_test_endpoint(&env, &provider));

        client.deactivate_endpoint(&provider, &ep_id);
        assert_eq!(client.get_active_endpoints_count(&provider), 0);

        client.activate_endpoint(&provider, &ep_id);

        let stored = client.get_endpoint(&ep_id).unwrap();
        assert!(stored.is_active);
        assert_eq!(client.get_active_endpoints_count(&provider), 1);
    }

    #[test]
    fn test_increment_request_count() {
        let env = Env::default();
        env.mock_all_auths();

        let admin = Address::generate(&env);
        let provider = Address::generate(&env);
        let contract_id = env.register(RegistryContract, {});
        let client = RegistryContractClient::new(&env, &contract_id);

        client.initialize(&admin);
        client.register_provider(
            &provider,
            &Symbol::new(&env, "Provider"),
            &Symbol::new(&env, "desc"),
        );
        let ep_id = client.register_endpoint(&provider, &create_test_endpoint(&env, &provider));

        client.increment_request_count(&ep_id);
        client.increment_request_count(&ep_id);
        client.increment_request_count(&ep_id);

        let stored = client.get_endpoint(&ep_id).unwrap();
        assert_eq!(stored.total_requests, 3);
    }

    #[test]
    #[should_panic(expected = "ProviderNotFound")]
    fn test_get_nonexistent_provider_panics() {
        let env = Env::default();
        env.mock_all_auths();

        let admin = Address::generate(&env);
        let bogus = Address::generate(&env);
        let contract_id = env.register(RegistryContract, {});
        let client = RegistryContractClient::new(&env, &contract_id);

        client.initialize(&admin);
        client.get_provider(&bogus);
    }

    #[test]
    fn test_get_nonexistent_endpoint_returns_none() {
        let env = Env::default();
        env.mock_all_auths();

        let admin = Address::generate(&env);
        let contract_id = env.register(RegistryContract, {});
        let client = RegistryContractClient::new(&env, &contract_id);

        client.initialize(&admin);
        assert!(client.get_endpoint(&999).is_none());
    }

    #[test]
    #[should_panic(expected = "ProviderNotActive")]
    fn test_register_endpoint_inactive_provider_panics() {
        let env = Env::default();
        env.mock_all_auths();

        let admin = Address::generate(&env);
        let provider = Address::generate(&env);
        let contract_id = env.register(RegistryContract, {});
        let client = RegistryContractClient::new(&env, &contract_id);

        client.initialize(&admin);
        client.register_provider(
            &provider,
            &Symbol::new(&env, "Provider"),
            &Symbol::new(&env, "desc"),
        );
        client.deactivate_provider(&provider);
        client.register_endpoint(&provider, &create_test_endpoint(&env, &provider));
    }

    #[test]
    fn test_endpoint_preserves_requests_on_update() {
        let env = Env::default();
        env.mock_all_auths();

        let admin = Address::generate(&env);
        let provider = Address::generate(&env);
        let contract_id = env.register(RegistryContract, {});
        let client = RegistryContractClient::new(&env, &contract_id);

        client.initialize(&admin);
        client.register_provider(
            &provider,
            &Symbol::new(&env, "Provider"),
            &Symbol::new(&env, "desc"),
        );
        let ep_id = client.register_endpoint(&provider, &create_test_endpoint(&env, &provider));

        client.increment_request_count(&ep_id);
        client.increment_request_count(&ep_id);

        let mut updated = create_test_endpoint(&env, &provider);
        updated.price_per_request = 500_000;
        client.update_endpoint(&provider, &ep_id, &updated);

        let stored = client.get_endpoint(&ep_id).unwrap();
        assert_eq!(stored.total_requests, 2);
        assert_eq!(stored.price_per_request, 500_000);
    }

    #[test]
    #[should_panic(expected = "NotAuthorized")]
    fn test_update_endpoint_wrong_provider_panics() {
        let env = Env::default();
        env.mock_all_auths();

        let admin = Address::generate(&env);
        let provider = Address::generate(&env);
        let wrong_provider = Address::generate(&env);
        let contract_id = env.register(RegistryContract, {});
        let client = RegistryContractClient::new(&env, &contract_id);

        client.initialize(&admin);
        client.register_provider(
            &provider,
            &Symbol::new(&env, "Provider"),
            &Symbol::new(&env, "desc"),
        );
        let ep_id = client.register_endpoint(&provider, &create_test_endpoint(&env, &provider));

        client.update_endpoint(
            &wrong_provider,
            &ep_id,
            &create_test_endpoint(&env, &wrong_provider),
        );
    }

    #[test]
    fn test_update_endpoint_active_to_inactive() {
        let env = Env::default();
        env.mock_all_auths();

        let admin = Address::generate(&env);
        let provider = Address::generate(&env);
        let contract_id = env.register(RegistryContract, {});
        let client = RegistryContractClient::new(&env, &contract_id);

        client.initialize(&admin);
        client.register_provider(
            &provider,
            &Symbol::new(&env, "Provider"),
            &Symbol::new(&env, "desc"),
        );
        let ep_id = client.register_endpoint(&provider, &create_test_endpoint(&env, &provider));
        assert_eq!(client.get_active_endpoints_count(&provider), 1);

        let mut updated = create_test_endpoint(&env, &provider);
        updated.is_active = false;
        client.update_endpoint(&provider, &ep_id, &updated);

        assert_eq!(client.get_active_endpoints_count(&provider), 0);

        let stored = client.get_endpoint(&ep_id).unwrap();
        assert!(!stored.is_active);
    }
}
