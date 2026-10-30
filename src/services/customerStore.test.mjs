// Run with Node 24+: node --test src/services/demoService.test.mjs
import { registerHooks, stripTypeScriptTypes } from 'node:module';
import { readFileSync, existsSync } from 'node:fs';
import assert from 'node:assert/strict';
import { test } from 'node:test';

registerHooks({
  resolve(specifier, context, next) {
    if (specifier.startsWith('.') && context.parentURL) {
      const url = new URL(`${specifier}.ts`, context.parentURL);
      if (existsSync(url)) return { url: url.href, shortCircuit: true };
    }
    return next(specifier, context);
  },
  load(url, context, next) {
    if (url.endsWith('.ts')) return { format: 'module', source: stripTypeScriptTypes(readFileSync(new URL(url), 'utf8')), shortCircuit: true };
    return next(url, context);
  },
});


const entries = new Map();
Object.defineProperty(globalThis, 'localStorage', { value: { getItem: key => entries.get(key) ?? null, setItem: (key,value) => entries.set(key,value) }, configurable: true });
const { createSeed } = await import('../mocks/seed.ts');
const { addCustomerProducts, productConditions, featuredProductIds } = await import('../mocks/customerMerchandising.ts');
const api = await import('./demoService.ts');
test('new fixtures preserve existing prices, stock and orders and reconcile once', () => {
 const state = createSeed();
 state.products.find(p => p.id === 'banana-tieu').availableKg = 17;
 state.products.find(p => p.id === 'banana-tieu').publicPricePerKg = 23000;
 const before = structuredClone(state);
 addCustomerProducts(state); addCustomerProducts(state);
 assert.deepEqual(state,before);
 const old = createSeed(); old.products = old.products.filter(p => !['banana-tieu','avocado-sap','lettuce-dalat'].includes(p.id));
 old.qualityReviews = old.qualityReviews.filter(p => !['banana-tieu','avocado-sap','lettuce-dalat'].includes(p.productId));
 const history = structuredClone(old.orders); const oldProducts = structuredClone(old.products);
 addCustomerProducts(old); assert.deepEqual(old.orders,history);
 for(const p of oldProducts) assert.deepEqual(old.products.find(x => x.id === p.id),p);
 assert.equal(productConditions['avocado-034'],undefined);
 for(const id of featuredProductIds) assert.ok(productConditions[id]);
});
test('new products appear in catalog and can be purchased through existing checkout', async () => {
 await api.setDemoRole('CUSTOMER');
 const catalog = await api.getCustomerCatalog();
 for(const id of featuredProductIds) assert.ok(catalog.find(p => p.id === id),id);
 const items = ['banana-tieu','avocado-sap','lettuce-dalat'].map(productId => ({productId,quantityKg:1}));
 const order = await api.placeOrder({customerId:'customer-1',deliveryAddressId:'address-1',items,deliveryDate:api.nextDeliveryDate(await api.getDemoClock()),deliverySlot:'MORNING',requestKey:'customer-store-test'});
 assert.equal(order.items.length,3);
 const updated = await api.getCustomerCatalog();
 for(const item of items) assert.equal(updated.find(p=>p.id===item.productId).availableKg,catalog.find(p=>p.id===item.productId).availableKg-1);
 assert.ok(entries.has('b2b-demo-v1'));
});

test('checkout options calculate fees, persist snapshots and protect retry identity', async () => {
 await api.setDemoRole('CUSTOMER');
 const base = {customerId:'customer-1',deliveryAddressId:'address-1',items:[{productId:'banana-tieu',quantityKg:2}],deliveryDate:api.nextDeliveryDate(await api.getDemoClock()),deliverySlot:'MORNING'};
 for (const [carrier,fee] of [['GHN',35000],['GHTK',30000],['TRUCK',25000]]) {
   const quote = await api.quoteCheckout({...base,checkoutOptions:{orderMode:'SINGLE',carrier,paymentMethod:'COD',insurance:false}});
   assert.equal(quote.shippingFeeVnd,fee); assert.equal(quote.totalVnd,quote.subtotalVnd+fee);
 }
 const input = {...base,requestKey:'checkout-options-test',checkoutOptions:{orderMode:'GROUP',carrier:'GHN',paymentMethod:'MOMO',insurance:true}};
 const quote = await api.quoteCheckout(input);
 assert.equal(quote.shippingFeeVnd,20000); assert.equal(quote.insuranceFeeVnd,Math.round(quote.subtotalVnd*0.005));
 const order = await api.placeOrder(input);
 assert.equal(order.totalVnd,quote.subtotalVnd+20000+quote.insuranceFeeVnd);
 assert.deepEqual(order.checkoutOptions,input.checkoutOptions);
 assert.equal((await api.placeOrder(input)).id,order.id);
 await assert.rejects(api.placeOrder({...input,checkoutOptions:{...input.checkoutOptions,paymentMethod:'COD'}}));
 await assert.rejects(api.quoteCheckout({...base,checkoutOptions:{...input.checkoutOptions,carrier:'INVALID'}}));
 const saved = JSON.parse(entries.get('b2b-demo-v1'));
 assert.ok(JSON.stringify(saved).includes('checkout-options-test'));
 const found = (await api.getCustomerOrders('customer-1')).find(x=>x.id===order.id);
 assert.deepEqual(found.checkoutOptions,input.checkoutOptions);
});
