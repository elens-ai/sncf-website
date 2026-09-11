import test from 'node:test'
import assert from 'node:assert/strict'
import { createHmac } from 'node:crypto'
import { amountInPaise, validPaymentSignature } from '../src/payments/razorpay'
test('amounts convert exactly and reject malformed or unsupported values', () => {
  assert.equal(amountInPaise('1000.25'),100025)
  assert.equal(amountInPaise('1'),100)
  for(const value of ['0','-1','1e3','NaN','1.001','1000001','']) assert.throws(()=>amountInPaise(value))
})
test('payment signatures bind both the stored order and returned payment', () => {
  const signature=createHmac('sha256','test-only-secret').update('order_abc|pay_123').digest('hex')
  assert.ok(validPaymentSignature('order_abc','pay_123',signature,'test-only-secret'))
  assert.equal(validPaymentSignature('order_other','pay_123',signature,'test-only-secret'),false)
  assert.equal(validPaymentSignature('order_abc','pay_other',signature,'test-only-secret'),false)
  assert.equal(validPaymentSignature('order_abc','pay_123','invalid','test-only-secret'),false)
})
