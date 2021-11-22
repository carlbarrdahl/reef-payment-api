- Users

  - app admin
  - merchant admin
  - paying customer

- move reef payments to /helpers
- add finalized block in payment db

## V2

- [ ] Create Payment request to Payment API (to be called from Merchant backend)
  - [x] Create `POST /checkout` endpoint
  - [x] Receive `paymentId`, `amount`, `merchant_address`, `timestamp`, `redirectUrl`, `apiKey` (in header)
  - [ ] Validate params (amount is number, redirect is url, timestamp is recent)
  - [ ] Receive lineItems and store so Checkout UI can be richer with information (out of scope)
  - [x] Generate wallet
  - [x] Encrypt and store address + key
    - [x] `wallet[paymentId]`
  - [x] Return `checkoutUrl`
  - [x] Watch incoming transfers
    - [ ] Unsub when `timestamp` + 5 min reached
  - [x] Transfer to merchant `address`
  - [x] Store event in db `payment[paymentId]`
- [x] Simulate Payment in Merchant Dashboard
  - [x] Form for params
  - [x] Call checkout endpoint to get `checkoutUrl`
  - [x] Redirect
- [ ] Checkout UI
  - [x] Create checkout page (reached via `checkoutUrl`)
  - [x] Get query params (`redirectUrl`, `amount`, `timestamp`, `address`)
  - [ ] Display countdown from `timestamp`
  - [x] Display address and amount to pay to
  - [x] Pay Button to trigger Polkadot extension
  - [x] Watch `payment[paymentId]` for payments
  - [x] Display success message and redirect to `redirectUrl`
  - [ ] When countdown runs out - display retry button (out of scope)

---

## V1

- [x] Add ChakraUI
- [x] Admin UI
  - [x] Auth - signIn/signOut
  - [x] Create API key
    - [x] Create custom token
    - [x] Store token in db
    - [x] Show in UI
  - [x] Set wallet address
    - [x] UI to enter address and save
    - [x] Store in db
  - [x] Monitor / manage payments
    - [x] Query transactions for address
    - [x] UI to update address
    - [x] Search address
  - [ ] Webhooks whitelist (out of scope)
  - [ ] Refund payment (out of scope)
  - [ ] Merchants list for admins (out of scope?)
- [x] Shop UI
  - [x] Inputs for API key, webhook and amount
  - [x] Call payment api
  - [x] Update UI with address
  - [x] Update UI on payment success
  - [x] Pay with browser wallet
- [x] Payment API endpoint
  - [x] Verify API key
  - [x] Validate amount and webhookUrl
  - [x] Generate unique wallet address and return to caller
  - [x] Listen to transfers into address
  - [x] Calculate transaction fee and subtract
  - [x] Transfer amount from new wallet into main account
  - [x] Trigger webhook when tx fulfills
  - [x] Deploy to Firebase
