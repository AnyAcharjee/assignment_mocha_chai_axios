# DMoney Integration Testing Suite

Integration tests for the DMoney digital wallet REST API, built with Mocha, Chai, and Axios. The suite exercises the full user + transaction lifecycle end-to-end against a running DMoney server, chaining access tokens and generated user data (ids, phone numbers) across sequential test steps.

## Test Flows Covered

- **Admin Create and Activate Customer Flow** — admin login, dynamically creates Customer/Agent/Merchant users via `/user/create`, activates each via `/user/update/:id`
- **System Deposit Flow** — SYSTEM login and deposit to an agent account via `/transaction/deposit`
- **Agent Deposit Flow** — agent login (OTP verified) and deposit to a customer, asserting commission
- **Customer Send Money Flow** — customer login (OTP verified) and peer-to-peer transfer via `/transaction/sendmoney`, asserting service fee
- **Customer Withdraw and Payment Flow** — customer cashout via `/transaction/withdraw` and merchant payment via `/transaction/payment`, asserting service fee

## Technologies

- [Node.js](https://nodejs.org/)
- [Mocha](https://mochajs.org/) — test runner
- [Chai](https://www.chaijs.com/) — assertion library
- [Axios](https://axios-http.com/) — HTTP client
- [dotenv](https://www.npmjs.com/package/dotenv) — environment variable configuration

## Prerequisites

- Node.js (v18 or later)
- A running instance of the DMoney API server, reachable at the URL configured in `.env`

## Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd assignment_integration_testing_mocha_chai_axios
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the project root:

```env
BASE_URL=http://localhost:5000
```

### 4. Run the tests

```bash
npm test
```

This runs `mocha dmoney.spec.js` against the configured `BASE_URL`.

## Notes

- Tests run sequentially and share state (access tokens, user ids, phone numbers) via module-level variables, since later flows depend on accounts/tokens created by earlier ones.
- The test suite creates real users and moves real balances on the target server — run it against a dev/test environment, not production.
- Some transactions are subject to server-side business rules (e.g. daily deposit limits, minimum balance requirements); running the suite repeatedly against the same server/account may cause otherwise-passing tests to fail once those limits are hit.
