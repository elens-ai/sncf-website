import { createHmac, timingSafeEqual } from 'node:crypto'

/** Server-only adapter. Call only after donor verification and persisting the
 * contribution. Never put PAN, Aadhaar or address fields in Razorpay notes. */
function credentials() {
  const key = process.env.RAZORPAY_KEY_ID
  const secret = process.env.RAZORPAY_KEY_SECRET
  if (!key || !secret) throw new Error('Razorpay is not configured')
  return { key, secret }
}
export function amountInPaise(value: string) {
  if (!/^\d{1,8}(\.\d{1,2})?$/.test(value)) throw new Error('Invalid contribution amount')
  const [rupees, fraction = ''] = value.split('.')
  const paise = Number(rupees) * 100 + Number(fraction.padEnd(2, '0'))
  if (!Number.isSafeInteger(paise) || paise < 100 || paise > 100000000) throw new Error('Contribution amount is outside supported limits')
  return paise
}
export function validPaymentSignature(orderId: string, paymentId: string, signature: string, secret: string) {
  if (!/^order_[A-Za-z0-9]+$/.test(orderId) || !/^pay_[A-Za-z0-9]+$/.test(paymentId) || !/^[a-f0-9]{64}$/i.test(signature)) return false
  const expected = createHmac('sha256', secret).update(`${orderId}|${paymentId}`).digest()
  return timingSafeEqual(expected, Buffer.from(signature, 'hex'))
}
async function api(path: string, body?: unknown) {
  const { key, secret } = credentials()
  const response = await fetch(`https://api.razorpay.com/v1/${path}`, {
    method: body ? 'POST' : 'GET',
    headers: { Authorization: `Basic ${Buffer.from(`${key}:${secret}`).toString('base64')}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(15000),
  })
  // Do not expose gateway responses, credentials or donor details in client errors.
  if (!response.ok) throw new Error('Payment provider request failed')
  return response.json()
}
export async function createContributionOrder(amount: string, contributionId: string) {
  if (!/^[a-zA-Z0-9_-]{1,40}$/.test(contributionId)) throw new Error('Invalid contribution reference')
  const paise = amountInPaise(amount)
  const order = await api('orders', { amount: paise, currency: 'INR', receipt: contributionId })
  if (!/^order_[a-zA-Z0-9]+$/.test(order.id) || order.amount !== paise || order.currency !== 'INR') throw new Error('Unexpected payment order')
  return { orderId: order.id as string, amount: paise, currency: 'INR', keyId: credentials().key }
}
/** The orderId and amount MUST come from the persisted contribution, never
 * from the browser callback. Only captured funds qualify as paid. */
export async function verifyContributionPayment(storedOrderId: string, storedAmount: number, paymentId: string, signature: string) {
  if (!validPaymentSignature(storedOrderId, paymentId, signature, credentials().secret)) throw new Error('Invalid payment signature')
  const payment = await api(`payments/${encodeURIComponent(paymentId)}`)
  if (payment.order_id !== storedOrderId || payment.amount !== storedAmount || payment.currency !== 'INR') throw new Error('Payment does not match contribution')
  return { captured: payment.status === 'captured' && payment.captured === true, paymentId }
}
