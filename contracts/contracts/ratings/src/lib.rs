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
pub struct Review {
    pub reviewer: Address,
    pub endpoint_id: u64,
    pub rating: u32,
    pub comment: Symbol,
    pub timestamp: u64,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct RatingSummary {
    pub endpoint_id: u64,
    pub total_reviews: u32,
    pub average_rating: u32,
    pub total_score: u64,
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
pub enum RatingsError {
    NotAuthorized = 1,
    InvalidRating = 2,
    AlreadyReviewed = 3,
    EndpointNotFound = 4,
}

#[contracttype]
pub enum DataKey {
    Admin,
    Review(Address, u64),
    Summary(u64),
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
pub struct RatingsContract;

pub trait RatingsTrait {
    fn initialize(env: Env, admin: Address);

    fn submit_review(
        env: Env,
        reviewer: Address,
        endpoint_id: u64,
        rating: u32,
        comment: Symbol,
    );

    fn get_rating_summary(env: Env, endpoint_id: u64) -> RatingSummary;

    fn get_review(env: Env, reviewer: Address, endpoint_id: u64) -> Option<Review>;

    fn has_reviewed(env: Env, reviewer: Address, endpoint_id: u64) -> bool;
}

#[contractimpl]
impl RatingsTrait for RatingsContract {
    fn initialize(env: Env, admin: Address) {
        admin.require_auth();

        if env.storage().instance().has(&DataKey::Admin) {
            panic!("already initialized");
        }

        env.storage().instance().set(&DataKey::Admin, &admin);
        extend_instance(&env);
    }

    fn submit_review(
        env: Env,
        reviewer: Address,
        endpoint_id: u64,
        rating: u32,
        comment: Symbol,
    ) {
        reviewer.require_auth();
        extend_instance(&env);

        if rating < 1 || rating > 5 {
            panic!("InvalidRating");
        }

        let review_key = DataKey::Review(reviewer.clone(), endpoint_id);
        let summary_key = DataKey::Summary(endpoint_id);

        let mut summary: RatingSummary = env
            .storage()
            .persistent()
            .get(&summary_key)
            .unwrap_or_else(|| RatingSummary {
                endpoint_id,
                total_reviews: 0,
                average_rating: 0,
                total_score: 0,
            });

        let existing: Option<Review> = env.storage().persistent().get(&review_key);

        if let Some(old_review) = existing {
            summary.total_score = summary.total_score - (old_review.rating as u64) + (rating as u64);
        } else {
            summary.total_reviews += 1;
            summary.total_score += rating as u64;
        }

        summary.average_rating = if summary.total_reviews > 0 {
            (summary.total_score / summary.total_reviews as u64) as u32
        } else {
            0
        };

        let review = Review {
            reviewer: reviewer.clone(),
            endpoint_id,
            rating,
            comment,
            timestamp: env.ledger().timestamp(),
        };

        env.storage().persistent().set(&review_key, &review);
        env.storage().persistent().set(&summary_key, &summary);

        extend_persistent(&env, &review_key);
        extend_persistent(&env, &summary_key);
    }

    fn get_rating_summary(env: Env, endpoint_id: u64) -> RatingSummary {
        extend_instance(&env);
        let key = DataKey::Summary(endpoint_id);
        let summary: RatingSummary = env
            .storage()
            .persistent()
            .get(&key)
            .unwrap_or_else(|| RatingSummary {
                endpoint_id,
                total_reviews: 0,
                average_rating: 0,
                total_score: 0,
            });
        if summary.total_reviews > 0 {
            extend_persistent(&env, &key);
        }
        summary
    }

    fn get_review(env: Env, reviewer: Address, endpoint_id: u64) -> Option<Review> {
        extend_instance(&env);
        let key = DataKey::Review(reviewer, endpoint_id);
        let review: Option<Review> = env.storage().persistent().get(&key);
        if review.is_some() {
            extend_persistent(&env, &key);
        }
        review
    }

    fn has_reviewed(env: Env, reviewer: Address, endpoint_id: u64) -> bool {
        extend_instance(&env);
        let key = DataKey::Review(reviewer, endpoint_id);
        env.storage().persistent().has(&key)
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
        let contract_id = env.register(RatingsContract, {});
        let client = RatingsContractClient::new(&env, &contract_id);

        client.initialize(&admin);

        (env, admin, contract_id)
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
        let contract_id = env.register(RatingsContract, {});
        let client = RatingsContractClient::new(&env, &contract_id);

        client.initialize(&admin);
        client.initialize(&admin);
    }

    #[test]
    fn test_submit_review() {
        let (env, _admin, contract_id) = setup();
        let client = RatingsContractClient::new(&env, &contract_id);

        let reviewer = Address::generate(&env);
        let endpoint_id = 1u64;

        client.submit_review(
            &reviewer,
            &endpoint_id,
            &5u32,
            &Symbol::new(&env, "Excellent"),
        );

        let review = client.get_review(&reviewer, &endpoint_id).unwrap();
        assert_eq!(review.reviewer, reviewer);
        assert_eq!(review.endpoint_id, endpoint_id);
        assert_eq!(review.rating, 5);
        assert_eq!(review.comment, Symbol::new(&env, "Excellent"));
    }

    #[test]
    fn test_rating_summary_single_review() {
        let (env, _admin, contract_id) = setup();
        let client = RatingsContractClient::new(&env, &contract_id);

        let reviewer = Address::generate(&env);
        client.submit_review(
            &reviewer,
            &1u64,
            &5u32,
            &Symbol::new(&env, "Great"),
        );

        let summary = client.get_rating_summary(&1u64);
        assert_eq!(summary.endpoint_id, 1);
        assert_eq!(summary.total_reviews, 1);
        assert_eq!(summary.average_rating, 5);
        assert_eq!(summary.total_score, 5);
    }

    #[test]
    fn test_rating_summary_multiple_reviews() {
        let (env, _admin, contract_id) = setup();
        let client = RatingsContractClient::new(&env, &contract_id);

        let reviewer1 = Address::generate(&env);
        let reviewer2 = Address::generate(&env);
        let reviewer3 = Address::generate(&env);

        client.submit_review(&reviewer1, &1u64, &5u32, &Symbol::new(&env, "Great"));
        client.submit_review(&reviewer2, &1u64, &4u32, &Symbol::new(&env, "Good"));
        client.submit_review(&reviewer3, &1u64, &3u32, &Symbol::new(&env, "Ok"));

        let summary = client.get_rating_summary(&1u64);
        assert_eq!(summary.total_reviews, 3);
        assert_eq!(summary.total_score, 12);
        assert_eq!(summary.average_rating, 4);
    }

    #[test]
    fn test_update_existing_review() {
        let (env, _admin, contract_id) = setup();
        let client = RatingsContractClient::new(&env, &contract_id);

        let reviewer = Address::generate(&env);

        client.submit_review(&reviewer, &1u64, &2u32, &Symbol::new(&env, "Poor"));

        let summary = client.get_rating_summary(&1u64);
        assert_eq!(summary.total_reviews, 1);
        assert_eq!(summary.total_score, 2);
        assert_eq!(summary.average_rating, 2);

        client.submit_review(&reviewer, &1u64, &5u32, &Symbol::new(&env, "Better"));

        let summary = client.get_rating_summary(&1u64);
        assert_eq!(summary.total_reviews, 1);
        assert_eq!(summary.total_score, 5);
        assert_eq!(summary.average_rating, 5);

        let review = client.get_review(&reviewer, &1u64).unwrap();
        assert_eq!(review.rating, 5);
        assert_eq!(review.comment, Symbol::new(&env, "Better"));
    }

    #[test]
    fn test_has_reviewed() {
        let (env, _admin, contract_id) = setup();
        let client = RatingsContractClient::new(&env, &contract_id);

        let reviewer = Address::generate(&env);
        assert!(!client.has_reviewed(&reviewer, &1u64));

        client.submit_review(&reviewer, &1u64, &4u32, &Symbol::new(&env, "Good"));

        assert!(client.has_reviewed(&reviewer, &1u64));
        assert!(!client.has_reviewed(&reviewer, &2u64));
    }

    #[test]
    #[should_panic(expected = "InvalidRating")]
    fn test_invalid_rating_zero_panics() {
        let (env, _admin, contract_id) = setup();
        let client = RatingsContractClient::new(&env, &contract_id);

        let reviewer = Address::generate(&env);
        client.submit_review(&reviewer, &1u64, &0u32, &Symbol::new(&env, "Bad"));
    }

    #[test]
    #[should_panic(expected = "InvalidRating")]
    fn test_invalid_rating_six_panics() {
        let (env, _admin, contract_id) = setup();
        let client = RatingsContractClient::new(&env, &contract_id);

        let reviewer = Address::generate(&env);
        client.submit_review(&reviewer, &1u64, &6u32, &Symbol::new(&env, "Bad"));
    }

    #[test]
    fn test_get_review_nonexistent() {
        let (env, _admin, contract_id) = setup();
        let client = RatingsContractClient::new(&env, &contract_id);

        let reviewer = Address::generate(&env);
        assert!(client.get_review(&reviewer, &1u64).is_none());
    }

    #[test]
    fn test_get_summary_no_reviews() {
        let (env, _admin, contract_id) = setup();
        let client = RatingsContractClient::new(&env, &contract_id);

        let summary = client.get_rating_summary(&999u64);
        assert_eq!(summary.total_reviews, 0);
        assert_eq!(summary.average_rating, 0);
        assert_eq!(summary.total_score, 0);
    }

    #[test]
    fn test_separate_endpoint_ratings() {
        let (env, _admin, contract_id) = setup();
        let client = RatingsContractClient::new(&env, &contract_id);

        let reviewer = Address::generate(&env);
        client.submit_review(&reviewer, &1u64, &5u32, &Symbol::new(&env, "Great"));
        client.submit_review(&reviewer, &2u64, &3u32, &Symbol::new(&env, "Ok"));

        let summary1 = client.get_rating_summary(&1u64);
        let summary2 = client.get_rating_summary(&2u64);

        assert_eq!(summary1.total_reviews, 1);
        assert_eq!(summary1.average_rating, 5);
        assert_eq!(summary2.total_reviews, 1);
        assert_eq!(summary2.average_rating, 3);
    }

    #[test]
    fn test_review_preserves_timestamp_on_update() {
        let (env, _admin, contract_id) = setup();
        let client = RatingsContractClient::new(&env, &contract_id);

        let reviewer = Address::generate(&env);
        client.submit_review(&reviewer, &1u64, &3u32, &Symbol::new(&env, "Ok"));

        let review1 = client.get_review(&reviewer, &1u64).unwrap();
        let ts1 = review1.timestamp;

        client.submit_review(&reviewer, &1u64, &5u32, &Symbol::new(&env, "Great"));

        let review2 = client.get_review(&reviewer, &1u64).unwrap();
        assert!(review2.timestamp >= ts1);
    }

    #[test]
    fn test_many_reviewers_average() {
        let (env, _admin, contract_id) = setup();
        let client = RatingsContractClient::new(&env, &contract_id);

        for i in 0..10u32 {
            let reviewer = Address::generate(&env);
            let rating = (i % 5) + 1;
            client.submit_review(&reviewer, &1u64, &rating, &Symbol::new(&env, "Review"));
        }

        let summary = client.get_rating_summary(&1u64);
        assert_eq!(summary.total_reviews, 10);
        assert!(summary.total_score > 0);
        assert!(summary.average_rating >= 1 && summary.average_rating <= 5);
    }
}
