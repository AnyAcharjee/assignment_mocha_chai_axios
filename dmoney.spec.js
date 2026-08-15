import { expect } from 'chai';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();
const BASE_URL = process.env.BASE_URL;

let admin_access_token;
let user_ids = [];
let customer1_phone, customer2_phone, agent_phone, merchant_phone;

describe('DMoney Integration Test - Admin Create and Activate Customer Flow', function () {
  this.timeout(10000);

  it('should login as admin and receive an access_token', async function () {
    const response = await axios.post(
      `${BASE_URL}/user/login`,
      {
        email: 'admin@dmoney.com',
        password: '1234',
      },
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );

    expect(response.status).to.equal(200);
    expect(response.data).to.have.property('token');

    admin_access_token = response.data.token;

    expect(admin_access_token).to.be.a('string');
    expect(admin_access_token).to.not.be.empty;
  });

  customer1_phone = crateUser('Customer');
  customer2_phone = crateUser('Customer');
  agent_phone = crateUser('Agent');
  merchant_phone = crateUser('Merchant');
  console.log("TEMP VERIFY PHONES", { customer1_phone, customer2_phone, agent_phone, merchant_phone });

});

function crateUser(role) {
  const randomDigits = Math.floor(1000000 + Math.random() * 8999999);
  const name = role+randomDigits;
  const email = `asuser+b19+${randomDigits}@gmail.com`;
  const phone = `0181${randomDigits}`;
  let user_primary_id;
    it('should create a new user', async function () {
    const response = await axios.post(
      `${BASE_URL}/user/create`,
      {
        name: name,
        email: email,
        password: '1234',
        phone_number: phone,
        nid: '9876543210',
        role: role,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `bearer ${admin_access_token}`,
          'X-AUTH-SECRET-KEY': 'ROADTOSDET',
        },
      }
    );
    user_primary_id = response.data.user.id;
    expect(response.status).to.equal(201);
    expect(response.data).to.have.property('user');
    expect(response.data.user).to.have.property('id');

  });

  activate_user(() => user_primary_id)

  return phone;
}

function activate_user(getUserId){
  it('should activate the newly created customer', async function () {
    const user_id = getUserId();
    const response = await axios.patch(
      `${BASE_URL}/user/update/${user_id}`,
      {
        status: 'active',
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${admin_access_token}`,
          'X-AUTH-SECRET-KEY': 'ROADTOSDET',
        },
      }
    );

    expect(response.status).to.equal(200);
    expect(response.data).to.have.property('user');
    expect(response.data.user).to.have.property('status', 'active');
  });
}
      

describe('DMoney Integration Test - System Deposit Flow', function () {
  this.timeout(10000);

  let system_access_token;

  it('should login as SYSTEM and receive an access_token', async function () {
    const response = await axios.post(
      `${BASE_URL}/user/login`,
      {
        email: 'SYSTEM',
        password: '1234',
      },
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );

    expect(response.status).to.equal(200);
    expect(response.data).to.have.property('token');
    //console.log("System Access Token:", response);

    system_access_token = response.data.token;

    expect(system_access_token).to.be.a('string');
    expect(system_access_token).to.not.be.empty;
  });

  it('should deposit 5000 tk to agent account', async function () {
    const response = await axios.post(
      `${BASE_URL}/transaction/deposit`,
      {
        from_account: 'SYSTEM',
        to_account: agent_phone,
        amount: 5000,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${system_access_token}`,
          'X-AUTH-SECRET-KEY': 'ROADTOSDET',
        },
      }
    );

    expect(response.status).to.be.oneOf([200, 201]);
    expect(response.data).to.exist;
  });
});

describe('DMoney Integration Test - Agent Deposit Flow', function () {
  this.timeout(10000);

  let agent_access_token;

  it('should login as agent and require OTP verification', async function () {
    const response = await axios.post(
      `${BASE_URL}/user/login?env=dev`,
      {
        email: agent_phone,
        password: '1234',
      },
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );

    expect(response.status).to.equal(200);
    expect(response.data).to.have.property('otpRequired', true);
  });

  it('should verify otp and receive an agent access_token', async function () {
    const response = await axios.post(
      `${BASE_URL}/user/verify-otp?env=dev`,
      {
        identifier: agent_phone,
        otp: '0000',
      },
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );

    expect(response.status).to.equal(200);
    expect(response.data).to.have.property('token');

    agent_access_token = response.data.token;

    expect(agent_access_token).to.be.a('string');
    expect(agent_access_token).to.not.be.empty;
  });

  it('should deposit 2000 tk to customer account  with commission 50', async function () {
    const response = await axios.post(
      `${BASE_URL}/transaction/deposit`,
      {
        from_account: agent_phone,
        to_account: customer1_phone,
        amount: 2000,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `bearer ${agent_access_token}`,
          'X-AUTH-SECRET-KEY': 'ROADTOSDET',
        },
      }
    );

    expect(response.status).to.be.oneOf([200, 201]);
    expect(response.data).to.have.property('commission', 50);
  });
});

describe('DMoney Integration Test - Customer Send Money Flow', function () {
  this.timeout(10000);

  let customer_access_token;

  it('should login as customer and require OTP verification', async function () {
    const response = await axios.post(
      `${BASE_URL}/user/login?env=dev`,
      {
        email: customer1_phone,
        password: '1234',
      },
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );

    expect(response.status).to.equal(200);
    expect(response.data).to.have.property('otpRequired', true);
  });

  it('should verify otp and receive a customer access_token', async function () {
    const response = await axios.post(
      `${BASE_URL}/user/verify-otp?env=dev`,
      {
        identifier: customer1_phone,
        otp: '0000',
      },
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );

    expect(response.status).to.equal(200);
    expect(response.data).to.have.property('token');

    customer_access_token = response.data.token;

    expect(customer_access_token).to.be.a('string');
    expect(customer_access_token).to.not.be.empty;
  });

  it('should send 1000 tk to another customer account with fee 5', async function () {
    const response = await axios.post(
      `${BASE_URL}/transaction/sendmoney`,
      {
        from_account: customer1_phone,
        to_account: customer2_phone,
        amount: 1000,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `bearer ${customer_access_token}`,
          'X-AUTH-SECRET-KEY': 'ROADTOSDET',
        },
      }
    );

    expect(response.status).to.be.oneOf([200, 201]);
    expect(response.data).to.have.property('fee', 5);
  });
});

describe('DMoney Integration Test - Customer Withdraw and Payment Flow', function () {
  this.timeout(10000);

  let customer2_access_token;

  it('should login as customer and require OTP verification', async function () {
    const response = await axios.post(
      `${BASE_URL}/user/login?env=dev`,
      {
        email: customer2_phone,
        password: '1234',
      },
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );

    expect(response.status).to.equal(200);
    expect(response.data).to.have.property('otpRequired', true);
  });

  it('should verify otp and receive a customer2 access_token', async function () {
    const response = await axios.post(
      `${BASE_URL}/user/verify-otp?env=dev`,
      {
        identifier: customer2_phone,
        otp: '0000',
      },
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );

    expect(response.status).to.equal(200);
    expect(response.data).to.have.property('token');

    customer2_access_token = response.data.token;

    expect(customer2_access_token).to.be.a('string');
    expect(customer2_access_token).to.not.be.empty;
  });

  it('should cashout 500 tk from agent account with fee 5', async function () {
    const response = await axios.post(
      `${BASE_URL}/transaction/withdraw`,
      {
        from_account: customer2_phone,
        to_account: agent_phone,
        amount: 500,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${customer2_access_token}`,
          'X-AUTH-SECRET-KEY': 'ROADTOSDET',
        },
      }
    );

    expect(response.status).to.be.oneOf([200, 201]);
    expect(response.data).to.have.property('fee', 5);
  });

  it('should pay 400 tk to merchant  with fee 5', async function () {
    const response = await axios.post(
      `${BASE_URL}/transaction/payment`,
      {
        from_account: customer2_phone,
        to_account: merchant_phone,
        amount: 400,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${customer2_access_token}`,
          'X-AUTH-SECRET-KEY': 'ROADTOSDET',
        },
      }
    );

    expect(response.status).to.be.oneOf([200, 201]);
    expect(response.data).to.have.property('fee', 5);
  });
});

