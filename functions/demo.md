Preperations:

- Clear firebase data and auth accounts
- Generate two accounts
- Drip Reef into them
- Sign in to polka ext.

1. Sign in wih Google Account
2. Generate API key
3. Save wallet address
4. Copy API key
5. Go to /shop
6. Paste API key
7. Paste Webhook URL
8. Enter amount and pay
9. Sign with browser wallet OR Run payWallet script

5GCcgnwdLhwq3HmjsRaotPY5PuF8ivVcRTtP75JJPk7uzTMJ

5DJXUJF15J4BRYGQCt3vd9CgUssuJEhmtdekS3hK7bBcSogC

```
REEF_ADDRESS="5He5i74DWyBQVyMHkbm9D1F1bPoq1WbkpmKdKPoFJqrcan3F" REEF_AMOUNT="12000000000000000000" node payWallet.js

```

"
Hi!
This is a demo of a Reef Payment API I built for the Defi & Crosschain interoperability hackathon.
Here is how it works:

- A merchant signs in to the admin interface. I used Google signin for simplicity but other providers can easily be added.
- Next the merchant generates an API key to be used in their shop to initiate a payment
- A wallet address is also entered to which the funds will be transfered to.

- Then, a customer visits the Merchant store. I built a demo shop where you can fill in the API key to be used and the webhook URL which will be called when payment is successful. This would be in the Merchant's internal system.
- When payment is initiated, a random wallet is generated and its address is returned to the user.
- Payment is approved in the Polkadot extension
- On the backend the wallet is watched for incoming transactions and makes sure the amount is at least the price of the item purchased.
- Another transaction is sent to the merchant wallet address which we configured earlier in the admin interface. The amount minus transaction fee is sent.
- Finally the webhook is called to notify the merchant shop and the UI is updated.
- A Merchant can also refund any payments but this is not yet implemented

- You can find the code on my github. Thanks for watching
  "
