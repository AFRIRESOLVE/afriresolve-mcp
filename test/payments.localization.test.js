import assert from "node:assert/strict";
import test from "node:test";
import { createPayment } from "../src/payments/service.js";

async function hash(v) {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(v));
  return [...new Uint8Array(d)].map(b => b.toString(16).padStart(2, "0")).join("");
}

function db(apiHash) {
  const payments = [];
  return {
    payments,
    prepare(sql) {
      return {
        bind(...args) {
          return {
            async first() {
              if (sql.includes("FROM customers") && args[0] === apiHash)
                return {customer_id:"cust_test",name:"Test Customer",email:"test@example.com",status:"active",plan:"free",credits:100};
              return null;
            },
            async run() {
              if (sql.includes("INSERT INTO payments"))
                payments.push({amount:args[3],currency:args[4],credits:args[7]});
              return {success:true,meta:{changes:1}};
            }
          };
        }
      };
    }
  };
}

test("localized NGN payment", async () => {
  const apiKey = "afr_test_key";
  const d = db(await hash(apiKey));
  const oldFetch = globalThis.fetch;

  globalThis.fetch = async (url, options) => {
    assert.equal(url, "https://api.paystack.co/transaction/initialize");
    const body = JSON.parse(options.body);
    assert.equal(body.amount, "4500000");
    assert.equal(body.currency, "NGN");
    return new Response(JSON.stringify({
      status:true,
      data:{
        authorization_url:"https://checkout.paystack.com/test",
        access_code:"test",
        reference:body.reference
      }
    }), {status:200});
  };

  try {
    const result = await createPayment({
      db:d,
      secretKey:"test_secret",
      apiKey,
      plan:"developer",
      email:"test@example.com",
      callbackUrl:"https://example.com/pay/callback",
      country:"NG"
    });

    assert.equal(result.success,true);
    assert.equal(result.amount,45000);
    assert.equal(result.currency,"NGN");
    assert.equal(result.market,"NG");
    assert.equal(result.credits,10000);
    assert.equal(d.payments[0].amount,45000);
    assert.equal(d.payments[0].currency,"NGN");
    console.log("PASS localized NGN payment");
  } finally {
    globalThis.fetch = oldFetch;
  }
});

test("localized USD payment", async () => {
  const apiKey = "afr_test_key";
  const d = db(await hash(apiKey));
  const oldFetch = globalThis.fetch;
  globalThis.fetch = async (url, options) => {
    const body = JSON.parse(options.body);
    assert.equal(body.amount, "2900");
    assert.equal(body.currency, "USD");
    return new Response(JSON.stringify({status:true,data:{authorization_url:"https://checkout.paystack.com/test",access_code:"test",reference:body.reference}}), {status:200});
  };
  try {
    const result = await createPayment({db:d,secretKey:"test_secret",apiKey,plan:"developer",email:"test@example.com",callbackUrl:"https://example.com/pay/callback",country:"US"});
    assert.equal(result.success,true);
    assert.equal(result.amount,29);
    assert.equal(result.currency,"USD");
    assert.equal(result.market,"INTL");
    assert.equal(result.credits,10000);
    assert.equal(d.payments[0].amount,29);
    assert.equal(d.payments[0].currency,"USD");
    console.log("PASS localized USD payment");
  } finally { globalThis.fetch=oldFetch; }
});
