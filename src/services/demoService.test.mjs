// Run with Node 24+: node --test src/services/demoService.test.mjs
import { registerHooks, stripTypeScriptTypes } from 'node:module';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
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

const entries = new Map(process.env.DEMO_TEST_STATE ? [['b2b-demo-v1', process.env.DEMO_TEST_STATE]] : []);
let failWrites = false;
Object.defineProperty(globalThis, 'localStorage', { value: {
  getItem: key => entries.get(key) ?? null,
  setItem: (key, value) => { if (failWrites) throw new Error('Storage unavailable'); entries.set(key, value); },
}, configurable: true });
const rawApi = await import('./demoService.ts');
const api = { ...rawApi, placeOrder: async input => rawApi.placeOrder({ deliveryDate: rawApi.nextDeliveryDate(await rawApi.getDemoClock()), deliverySlot: 'MORNING', requestKey: crypto.randomUUID(), ...input }) };
const input = (kg, customer = 1, product = 'avocado-034') => ({ customerId: `customer-${customer}`, deliveryAddressId: `address-${customer}`, items: [{ productId: product, quantityKg: kg }] });
const rejects = (action, code) => assert.rejects(action, error => api.isServiceError(error) && error.code === code);

if (process.argv.includes('--migration')) {
  failWrites = true;
  await assert.rejects(() => api.getCustomerCatalog());
  assert.equal(JSON.parse(entries.get('b2b-demo-v1')).version, 1);
  failWrites = false;
  assert.equal((await api.getCustomerCatalog())[0].publicPricePerKg, 20000);
  assert.equal((await api.getSupplierListings('supplier-1')).find(p => p.id === 'user-old').commodityId, undefined);
  assert.equal((await api.getCustomerCatalog()).some(p => p.id === 'user-old'), false);
  await api.updateProduct({supplierId:'supplier-1',productId:'user-old',changes:{commodityId:'avocado-034'}});
  assert.equal((await api.getCustomerCatalog()).some(p => p.id === 'user-old'), true);
  assert.equal(JSON.parse(entries.get('b2b-demo-v1')).version, 5);
  assert.equal((await api.getCustomerOrders('customer-1'))[0].totalVnd, 810000);
} else if (process.argv.includes('--reload')) {
  assert.equal((await api.getCustomerOrders('customer-1')).length, 1);
  assert.equal((await api.getCustomerCatalog())[0].availableKg, 470);
  assert.equal((await api.getDemoSession()).role, 'ADMIN');
} else {
  test('happy path: prices, inventory, aggregation, shipment cascade and isolation', async () => {
    await api.resetDemoData();
    const events = [];
    const unsubscribe = api.subscribeDemoData(event => events.push(event.type));
    const catalog = await api.getCustomerCatalog();
    assert.equal(catalog[0].publicPricePerKg, 20000);
    assert.equal('basePricePerKg' in catalog[0], false);
    catalog[0].availableKg = 1;
    assert.equal((await api.getCustomerCatalog())[0].availableKg, 500);
    const quote = await api.quoteCheckout(input(30));
    assert.equal(quote.totalVnd, 630000);
    assert.equal((await api.getCustomerCatalog())[0].availableKg, 500);
    const a = await api.placeOrder(input(30));
    const b = await api.placeOrder(input(20, 2));
    assert.equal((await api.getCustomerCatalog())[0].availableKg, 450);
    await api.updateProduct({ supplierId: 'supplier-1', productId: 'avocado-034', changes: { publicPricePerKg: 30000 } });
    assert.equal((await api.getCustomerCatalog())[0].publicPricePerKg, 30000);
    assert.equal((await api.getCustomerOrders('customer-1'))[0].totalVnd, 630000);
    const lines = await api.aggregateDemand();
    assert.equal(lines[0].quantityKg, 50);
    const count = events.length;
    assert.deepEqual(await api.aggregateDemand(), lines);
    assert.equal(events.length, count);
    assert.deepEqual(await api.getSupplierDemand('supplier-1'), lines);
    const confirmationInput = { supplierId: 'supplier-1', orderIds: [a.id, b.id], vehiclePlate: 'DEMO' };
    const confirmation = await api.confirmSupplierDemand(confirmationInput);
    assert.deepEqual(await api.confirmSupplierDemand({ ...confirmationInput, orderIds: [b.id, a.id] }), confirmation);
    assert.equal((await api.getSupplierConfirmations()).length, 1);
    for (const order of [a, b]) await api.advanceOrderStatus(order.id, 'AT_HUB');
    const shipment = await api.assignDemoShipment({ orderIds: [a.id, b.id], routeLabel: 'Tuyến demo' });
    await rejects(() => api.advanceOrderStatus(a.id, 'DISPATCHED'), 'INVALID_STATUS_TRANSITION');
    await rejects(() => api.advanceShipmentStatus(shipment.id, 'DELIVERED'), 'INVALID_STATUS_TRANSITION');
    assert.equal((await api.getShipmentByOrderId(a.id)).status, 'ASSIGNED');
    await api.advanceShipmentStatus(shipment.id, 'IN_TRANSIT');
    assert.ok((await api.getAllOrders()).every(order => order.status === 'DISPATCHED'));
    await api.advanceShipmentStatus(shipment.id, 'DELIVERED');
    assert.ok((await api.getAllOrders()).every(order => order.status === 'DELIVERED'));
    assert.deepEqual(await api.aggregateDemand(), []);
    assert.equal((await api.getCustomerCatalog())[0].availableKg, 450);
    unsubscribe();
  });

  test('multi-supplier confirmation and new demand do not reuse old confirmations', async () => {
    await api.resetDemoData();
    const mixed = input(10);
    mixed.items.push({ productId: 'dragon-fruit', quantityKg: 5 });
    const order = await api.placeOrder(mixed);
    assert.equal(await api.getShipmentByOrderId(order.id), null);
    await api.aggregateDemand();
    await api.confirmSupplierDemand({ supplierId: 'supplier-1', orderIds: [order.id] });
    assert.equal((await api.getAllOrders())[0].status, 'AGGREGATED');
    await api.confirmSupplierDemand({ supplierId: 'supplier-2', orderIds: [order.id] });
    assert.equal((await api.getAllOrders())[0].status, 'SUPPLIER_CONFIRMED');
    const newer = await api.placeOrder(input(2));
    await api.aggregateDemand();
    assert.equal((await api.getAllOrders()).find(value => value.id === newer.id).status, 'AGGREGATED');
  });

  test('validation, simultaneous stock competition and failed mutations are atomic', async () => {
    await api.resetDemoData();
    await rejects(() => api.placeOrder(input(0)), 'VALIDATION_ERROR');
    await rejects(() => api.placeOrder(input(1.5)), 'VALIDATION_ERROR');
    await rejects(() => api.placeOrder({ ...input(1), deliveryAddressId: 'address-2' }), 'VALIDATION_ERROR');
    await rejects(() => api.placeOrder(input(501)), 'INSUFFICIENT_STOCK');
    await rejects(() => api.getShipmentByOrderId('missing'), 'NOT_FOUND');
    await rejects(() => api.setDemoSession({ activeSupplierId: undefined }), 'VALIDATION_ERROR');
    await rejects(() => api.updateProduct({ supplierId: 'supplier-1', productId: 'avocado-034', changes: { publicPricePerKg: Infinity } }), 'VALIDATION_ERROR');
    assert.equal((await api.getAllOrders()).length, 0);
    const duplicate = input(300);
    duplicate.items.push({ productId: 'avocado-034', quantityKg: 300 });
    await rejects(() => api.placeOrder(duplicate), 'INSUFFICIENT_STOCK');
    const competition = await Promise.allSettled([api.placeOrder(input(300)), api.placeOrder(input(300, 2))]);
    assert.equal(competition.filter(value => value.status === 'fulfilled').length, 1);
    assert.equal((await api.getCustomerCatalog())[0].availableKg, 200);
    assert.equal((await api.getAllOrders()).length, 1);
    const order = (await api.getAllOrders())[0];
    await rejects(() => api.assignDemoShipment({ orderIds: [order.id], routeLabel: 'Sai bước' }), 'INVALID_STATUS_TRANSITION');
    assert.deepEqual(await api.getShipments(), []);
    failWrites = true;
    await assert.rejects(() => api.placeOrder(input(1)));
    failWrites = false;
    assert.equal((await api.getAllOrders()).length, 1);
    assert.equal((await api.getCustomerCatalog())[0].availableKg, 200);
  });

  test('session events, persistence across module restart and reset isolation', async () => {
    await api.resetDemoData();
    entries.set('other-app', 'preserved');
    const events = [];
    const unsubscribe = api.subscribeDemoData(event => events.push(event.type));
    await api.setDemoRole('ADMIN');
    await api.setDemoRole('ADMIN');
    assert.deepEqual(events, ['SESSION_CHANGED']);
    assert.equal((await api.getDemoSession()).activeSupplierId, 'supplier-1');
    await api.placeOrder(input(30));
    const child = spawnSync(process.execPath, [fileURLToPath(import.meta.url), '--reload'], { env: { ...process.env, DEMO_TEST_STATE: entries.get('b2b-demo-v1') }, encoding: 'utf8' });
    assert.equal(child.status, 0, child.stderr);
    await api.resetDemoData();
    await api.resetDemoData();
    assert.deepEqual(events.slice(-2), ['RESET', 'RESET']);
    assert.equal(entries.get('other-app'), 'preserved');
    assert.equal((await api.getAllOrders()).length, 0);
    assert.equal((await api.getCustomerCatalog())[0].availableKg, 500);
    const count = events.length;
    unsubscribe();
    await api.setDemoRole('CUSTOMER');
    assert.equal(events.length, count);
  });

  test('listing creation, checkout repricing and mixed valid/invalid batch rollback', async () => {
    await api.resetDemoData();
    const product = await api.createProduct({ supplierId: 'supplier-2', commodityId: 'orange', uses: ['JUICE'], name: '  Cam demo  ', availableKg: 25, publicPricePerKg: 10000 });
    assert.equal(product.name, 'Cam demo');
    assert.ok((await api.getSupplierListings('supplier-2')).some(value => value.id === product.id));
    await rejects(() => api.createProduct({ supplierId: 'supplier-1', commodityId: 'orange', uses: [], name: ' ', availableKg: 1, publicPricePerKg: 1 }), 'VALIDATION_ERROR');
    const preview = await api.quoteCheckout(input(1));
    await api.updateProduct({ supplierId: 'supplier-1', productId: 'avocado-034', changes: { publicPricePerKg: 30000 } });
    const a = await api.placeOrder(input(1));
    assert.equal(preview.items[0].unitPriceVnd, 20000);
    assert.equal(a.items[0].unitPriceVnd, 30000);
    const b = await api.placeOrder(input(1, 2));
    await api.aggregateDemand();
    await rejects(() => api.confirmSupplierDemand({ supplierId: 'supplier-1', orderIds: [a.id, 'missing'] }), 'NOT_FOUND');
    assert.deepEqual(await api.getSupplierConfirmations(), []);
    await api.confirmSupplierDemand({ supplierId: 'supplier-1', orderIds: [a.id, b.id] });
    await api.advanceOrderStatus(a.id, 'AT_HUB');
    await rejects(() => api.assignDemoShipment({ orderIds: [a.id, b.id], routeLabel: 'Demo' }), 'INVALID_STATUS_TRANSITION');
    assert.deepEqual(await api.getShipments(), []);
    await api.advanceOrderStatus(b.id, 'AT_HUB');
    const shipment = await api.assignDemoShipment({ orderIds: [a.id, b.id], routeLabel: 'Demo' });
    await rejects(() => api.assignDemoShipment({ orderIds: [a.id], routeLabel: 'Trùng' }), 'INVALID_STATUS_TRANSITION');
    const before = await api.getDemoSession();
    await rejects(() => api.setDemoSession({ role: 'ADMIN', activeCustomerId: 'missing' }), 'NOT_FOUND');
    assert.deepEqual(await api.getDemoSession(), before);
    assert.equal((await api.getShipments()).length, 1);
    assert.equal(shipment.status, 'ASSIGNED');
  });
}

if (!process.argv.includes('--reload') && !process.argv.includes('--migration')) {
  test('v3 supplier listings, public profiles and editing keep historical orders usable', async () => {
    await api.resetDemoData();
    const mangoes = (await api.getCustomerCatalog()).filter(p => p.commodityId === 'mango-cat-hoa-loc');
    assert.equal(mangoes.length, 2);
    assert.equal(new Set(mangoes.map(p => p.supplier.id)).size, 2);
    assert.equal('phone' in mangoes[0].supplier, false);
    const order = await api.placeOrder(input(2, 1, mangoes[0].id));
    assert.equal(order.items[0].supplierName, mangoes[0].supplier.name);
    await rejects(() => api.updateProduct({supplierId: 'supplier-2', productId: mangoes[0].id, changes: {active: false}}), 'VALIDATION_ERROR');
    await rejects(() => api.updateProduct({supplierId: 'supplier-1', productId: mangoes[0].id, changes: {commodityId: 'orange'}}), 'VALIDATION_ERROR');
    await rejects(() => api.updateProduct({supplierId: 'supplier-1', productId: mangoes[0].id, changes: {imageUrl: 'javascript:alert(1)'}}), 'VALIDATION_ERROR');
    await rejects(() => api.updateProduct({supplierId: 'supplier-1', productId: mangoes[0].id, changes: {uses: ['JUICE', 'JUICE']}}), 'VALIDATION_ERROR');
    const url = 'data:image/png;base64,aGVsbG8=';
    await api.updateProduct({supplierId: 'supplier-1', productId: mangoes[0].id, changes: {active: false, imageUrl: url, availableKg: 8}});
    assert.equal((await api.getSupplierListings('supplier-1')).find(p => p.id === mangoes[0].id).imageUrl, url);
    await rejects(() => api.getCustomerProduct(mangoes[0].id), 'NOT_FOUND');
    assert.equal((await api.aggregateDemand())[0].quantityKg, 2);
    await api.confirmSupplierDemand({supplierId: 'supplier-1', orderIds: [order.id]});
    await api.advanceOrderStatus(order.id, 'AT_HUB');
    assert.equal((await api.getCustomerOrders('customer-1'))[0].totalVnd, order.totalVnd);
    assert.equal((await api.getSupplierListings('supplier-1')).find(p => p.id === mangoes[0].id).availableKg, 8);
  });
  test('migration uses supplier base prices once, preserves history and unclassified lots', async () => {
    const { upgradeStoredState } = await import('../store/demoStore.ts');
    const { createSeed } = await import('../mocks/seed.ts');
    const seed = createSeed();
    const legacy = {...seed, version: 1, pricing: {mode: 'PERCENT', value: 30}, products: seed.products.slice(0,3).map(({publicPricePerKg, commodityId: _commodityId, uses: _uses, ...p}) => ({...p, basePricePerKg: publicPricePerKg}))};
    delete legacy.commodities;
    legacy.products[0].availableKg = 470;
    legacy.products.push({...legacy.products[0], id: 'user-old', imageUrl: 'data:image/png;base64,aGVsbG8='});
    legacy.orders = [{id: 'order-old', customerId: 'customer-1', deliveryAddressId: 'address-1', items: [{productId:'avocado-034',productName:'Bơ 034',quantityKg:30,unitPriceVnd:26000,lineTotalVnd:780000}], subtotalVnd:780000,shippingFeeVnd:30000,totalVnd:810000,status:'PLACED',paymentStatus:'UNPAID',placedAt:'2026-10-22T01:00:00Z'}];
    legacy.confirmations = [{supplierId:'supplier-1',orderIds:['order-old'],confirmedAt:'2026-10-22T02:00:00Z'}];
    legacy.shipments = [{id:'shipment-old',orderIds:['order-old'],routeLabel:'Tuyến cũ',status:'ASSIGNED'}];
    const before = structuredClone(legacy);
    const migrated = upgradeStoredState(legacy);
    assert.deepEqual(legacy, before);
    assert.equal(migrated.version, 5);
    assert.equal(migrated.products[0].publicPricePerKg, 20000);
    assert.equal(migrated.products[0].availableKg, 470);
    assert.deepEqual(migrated.confirmations, before.confirmations);
    assert.deepEqual(migrated.shipments, before.shipments);
    assert.deepEqual(migrated.session, before.session);
    assert.equal(migrated.orders[0].totalVnd, 810000);
    assert.equal(migrated.orders[0].items[0].unitPriceVnd, 26000);
    assert.equal(migrated.products.at(-1).commodityId, undefined);
    assert.equal(migrated.products.at(-1).imageUrl, legacy.products.at(-1).imageUrl);
    assert.deepEqual(upgradeStoredState(migrated), migrated);
    assert.equal('pricing' in migrated, false);
    const child = spawnSync(process.execPath, [fileURLToPath(import.meta.url), '--migration'], {env:{...process.env,DEMO_TEST_STATE:JSON.stringify(legacy)},encoding:'utf8'});
    assert.equal(child.status, 0, child.stderr);
  });
}
