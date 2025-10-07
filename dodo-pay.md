# Subscription Integration Guide

> This guide will help you integrate the Dodo Payments Subscription Product into your website.

## Prerequisites

To integrate the Dodo Payments API, you'll need:

* A Dodo Payments merchant account
* API credentials (API key and webhook secret key) from the dashboard

If you don't have an account yet, you can get your business approved by [contacting the founder](https://demo.dodopayments.com/) or by filling out this [form](https://dodopayments.com/early-access).

For a more detailed guide on the prerequisites, check this [section](/developer-resources/integration-guide#dashboard-setup).

## API Integration

### Payment Links

Dodo Payments supports two types of payment links:

#### 1. Static Payment Links

[Detailed Guide](/developer-resources/integration-guide#1-static-payment-links)

#### 2. Dynamic Payment Links

Created via API call or our SDK with customer details. Here's an example:

There are two APIs for creating dynamic payment links:

* **Subscription Payment Link API** - [API reference](/api-reference/subscriptions/post-subscriptions)
* **One-time Payment Link API** - [API reference](/api-reference/payments/post-payments)

The guide below focuses on subscription payment link creation.

For detailed instructions on integrating one-time products, refer to this [One-time Integration Guide](/developer-resources/integration-guide).

<Info>Make sure you are passing `payment_link = true` to get payment link </Info>

<Tabs>
  <Tab title="Node.js SDK">
    ```javascript
    import DodoPayments from 'dodopayments';

    const client = new DodoPayments({
    bearerToken: process.env['DODO_PAYMENTS_API_KEY'], // This is the default and can be omitted
    });

    async function main() {
    const subscription = await client.subscriptions.create({
    billing: { city: 'city', country: 'IN', state: 'state', street: 'street', zipcode: 89789 },
    customer: { customer_id: 'customer_id' },
    product_id: 'product_id',
    payment_link: true,
    return_url: 'https://example.com/success',
    quantity: 1,
    });

    console.log(subscription.subscription_id);
    }

    main();
    ```
  </Tab>

  <Tab title="Python SDK">
    ```python
    import os
    from dodopayments import DodoPayments

    client = DodoPayments(
      bearer_token=os.environ.get("DODO_PAYMENTS_API_KEY"),  # This is the default and can be omitted
    )
    subscription = client.subscriptions.create(
      billing={
          "city": "city",
          "country": "IN",
          "state": "state",
          "street": "street",
          "zipcode": 54535,
      },
      customer={
          "customer_id": "customer_id"
      },
      product_id="product_id",
      quantity=1,
      payment_link: true,
      return_url: 'https://example.com/success',
    )
    print(subscription.subscription_id)
    ```
  </Tab>

  <Tab title="GO SDK">
    ```go
    package main

    import (
    "context"
    "fmt"

    "github.com/dodopayments/dodopayments-go"
    "github.com/dodopayments/dodopayments-go/option"
    )

    func main() {
    client := dodopayments.NewClient(
      option.WithBearerToken("My Bearer Token"), // defaults to os.LookupEnv("DODO_PAYMENTS_API_KEY")
    )
    subscription, err := client.Subscriptions.New(context.TODO(), dodopayments.SubscriptionNewParams{
      Billing: dodopayments.F(dodopayments.SubscriptionNewParamsBilling{
        City: dodopayments.F("city"),
        Country: dodopayments.F(dodopayments.CountryCodeIn),
        State: dodopayments.F("state"),
        Street: dodopayments.F("street"),
        Zipcode: dodopayments.F(int64(65787)),
      }),
      Customer: dodopayments.F[dodopayments.SubscriptionNewParamsCustomerUnion](dodopayments.SubscriptionNewParamsCustomerAttachExistingCustomer{
        CustomerID: dodopayments.F("customer_id"),
      }),
      ProductID: dodopayments.F("product_id"),
      Quantity: dodopayments.F(int64(1)),
    })
    if err != nil {
      panic(err.Error())
    }
    fmt.Printf("%+v\n", subscription.SubscriptionID)
    }
    ```
  </Tab>

  <Tab title="Api Reference">
    ```javascript
    import { NextRequest, NextResponse } from "next/server";      

    export async function POST(request: NextRequest) {
    try {
    const body = await request.json();
    const { formData, cartItems } = paymentRequestSchema.parse(body);

    const response = await fetch(`${process.env.NEXT_PUBLIC_DODO_TEST_API}/subscriptions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.DODO_API_KEY}`, // Replace with your API secret key generated from the Dodo Payments Dashboard
    },
    body: JSON.stringify({
      billing: {
        city: formData.city,
        country: formData.country,
        state: formData.state,
        street: formData.addressLine,
        zipcode: parseInt(formData.zipCode),
      },
      customer: {
        email: formData.email,
        name: `${formData.firstName} ${formData.lastName}`,
        phone_number: formData.phoneNumber || undefined,
      },
      payment_link: true,
      product_id: id,
      quantity: 1,
      return_url: process.env.NEXT_PUBLIC_RETURN_URL,
    }),
    });

    if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    return NextResponse.json(
      { error: "Payment link creation failed", details: errorData },
      { status: response.status }
    );
    }

    const data = await response.json();
    return NextResponse.json({ paymentLink: data.payment_link });
    } catch (err) {
    console.error("Payment error:", err);
    return NextResponse.json(
    {
      error: err instanceof Error ? err.message : "An unknown error occurred",
    },
    { status: 500 }
    );
    }
    }
    ```
  </Tab>
</Tabs>

### API Response

The following is an example of the response:

```json
{
  "client_secret": "<string>",
  "customer": {
    "customer_id": "<string>",
    "email": "<string>",
    "name": "<string>"
  },
  "metadata": {},
  "payment_link": "<string>",
  "recurring_pre_tax_amount": 1,
  "subscription_id": "<string>"
}
```

Redirect the customer to `payment_link`.

### Webhooks

When integrating subscriptions, you'll receive webhooks to track the subscription lifecycle. These webhooks help you manage subscription states and payment scenarios effectively.

To set up your webhook endpoint, please follow our [Detailed Integration Guide](/developer-resources/integration-guide#implementing-webhooks).

#### Subscription Event Types

The following webhook events track subscription status changes:

1. **`subscription.active`** - Subscription is successfully activated.
2. **`subscription.on_hold`** - Subscription is put on hold due to failed renewal.
3. **`subscription.failed`** - Subscription creation failed during mandate creation.
4. **`subscription.renewed`** - Subscription is renewed for the next billing period.

For reliable subscription lifecycle management, we recommend tracking these subscription events.

#### Payment Scenarios

**Successful Payment Flow**

When a payment succeeds, you'll receive the following webhooks:

1. `subscription.active` - Indicates subscription activation
2. `payment.succeeded` - Confirms the initial payment:
   * For immediate billing (0 trial days): Expect within 2-10 minutes
   * For trial days: whenever that ends
3. `subscription.renewed` - Indicates payment deduction and renewal for next cycle. (Basically, whenever payment gets deducted for subscription products, you will get `subscription.renewed` webhook along with `payment.succeeded`)

**Payment Failure Scenarios**

1. Subscription Failure

* `subscription.failed` - Subscription creation failed due to failure to create a mandate.
* `payment.failed` - Indicates failed payment.

<Info>**Best Practice**: To simplify implementation, we recommend primarily tracking subscription events for managing the subscription lifecycle.</Info>

### Sample Subscription event payload

***

| Property      | Type   | Required | Description                                                                                  |
| ------------- | ------ | -------- | -------------------------------------------------------------------------------------------- |
| `business_id` | string | Yes      | The unique identifier for the business                                                       |
| `timestamp`   | string | Yes      | The timestamp of when the event occurred (not necessarily the same as when it was delivered) |
| `type`        | string | Yes      | The type of event. See [Event Types](#event-types)                                           |
| `data`        | object | Yes      | The main data payload. See [Data Object](#data-object)                                       |

## Changing Subscription Plans

You can upgrade or downgrade a subscription plan using the change plan API endpoint. This allows you to modify the subscription's product, quantity, and handle proration.

<Card title="Change Plan API Reference" icon="arrows-rotate" href="/api-reference/subscriptions/change-plan">
  For detailed information about changing subscription plans, please refer to our Change Plan API documentation.
</Card>

### Proration Options

When changing subscription plans, you have two options for handling the immediate charge:

#### 1. `prorated_immediately`

* Calculates the prorated amount based on the remaining time in the current billing cycle
* Charges the customer only for the difference between the old and new plan
* During a trial period, this will immediately switch the user to the new plan, charging the customer right away

#### 2. `full_immediately`

* Charges the customer the full subscription amount for the new plan
* Ignores any remaining time or credits from the previous plan
* Useful when you want to reset the billing cycle or charge the full amount regardless of proration

#### 3. `difference_immediately`

* When upgrading, the customer is immediately charged the difference between the two plan amounts.
* For example, if the current plan is 30 Dollars and the customer upgrades to an 80 Dollars, they are charged \$50 instantly.
* When downgrading, the unused amount from the current plan is added as internal credit and automatically applied to future subscription renewals.
* For example, if the current plan is 50 Dollars and the customer switches to a 20 Dollars plan, the remaining \$30 is credited and used toward the next billing cycle.

### Behavior

* When you invoke this API, Dodo Payments immediately initiates a charge based on your selected proration option
* If the plan change is a downgrade and you use `prorated_immediately`, credits will be automatically calculated and added to the subscription's credit balance. These credits are specific to that subscription and will only be used to offset future recurring payments of the same subscription
* The `full_immediately` option bypasses credit calculations and charges the complete new plan amount

<Tip>
  **Choose your proration option carefully**: Use `prorated_immediately` for fair billing that accounts for unused time, or `full_immediately` when you want to charge the complete new plan amount regardless of the current billing cycle.
</Tip>

### Charge Processing

* The immediate charge initiated upon plan change usually completes processing in less than 2 minutes
* If this immediate charge fails for any reason, the subscription is automatically placed on hold until the issue is resolved

## On-Demand Subscriptions

<Info>
  On-demand subscriptions let you charge customers flexibly, not just on a fixed schedule. Contact support to enable this feature.
</Info>

**To create an on-demand subscription:**

To create an on-demand subscription, use the [POST /subscriptions](/api-reference/subscriptions/post-subscriptions) API endpoint and include the `on_demand` field in your request body. This allows you to authorize a payment method without an immediate charge, or set a custom initial price.

**To charge an on-demand subscription:**

For subsequent charges, use the [POST /subscriptions/charge](/api-reference/subscriptions/create-charge) endpoint and specify the amount to charge the customer for that transaction.

<Note>
  For a complete, step-by-step guide—including request/response examples, safe retry policies, and webhook handling—see the <a href="/developer-resources/ondemand-subscriptions">On-Demand Subscriptions Guide</a>.
</Note>



# List subscriptions

> Get a list of all subscriptions associated with your account.

## OpenAPI

````yaml get /subscriptions
paths:
  path: /subscriptions
  method: get
  servers:
    - url: https://test.dodopayments.com/
      description: Test Mode Server Host
    - url: https://live.dodopayments.com/
      description: Live Mode Server Host
  request:
    security:
      - title: API KEY
        parameters:
          query: {}
          header:
            Authorization:
              type: http
              scheme: bearer
          cookie: {}
    parameters:
      path: {}
      query:
        created_at_gte:
          schema:
            - type: string
              required: false
              description: Get events after this created time
              format: date-time
          style: form
        created_at_lte:
          schema:
            - type: string
              required: false
              description: Get events created before this time
              format: date-time
          style: form
        page_size:
          schema:
            - type: integer
              required: false
              description: Page size default is 10 max is 100
              minimum: 0
          style: form
        page_number:
          schema:
            - type: integer
              required: false
              description: Page number default is 0
              minimum: 0
          style: form
        customer_id:
          schema:
            - type: string
              required: false
              description: Filter by customer id
          style: form
        status:
          schema:
            - type: enum<string>
              enum:
                - pending
                - active
                - on_hold
                - cancelled
                - failed
                - expired
              required: false
              description: Filter by status
          style: form
        brand_id:
          schema:
            - type: string
              required: false
              description: filter by Brand id
          style: form
      header: {}
      cookie: {}
    body: {}
    codeSamples:
      - lang: JavaScript
        source: >-
          import DodoPayments from 'dodopayments';


          const client = new DodoPayments({
            bearerToken: 'My Bearer Token',
          });


          // Automatically fetches more pages as needed.

          for await (const subscriptionListResponse of
          client.subscriptions.list()) {
            console.log(subscriptionListResponse.product_id);
          }
      - lang: Python
        source: |-
          from dodopayments import DodoPayments

          client = DodoPayments(
              bearer_token="My Bearer Token",
          )
          page = client.subscriptions.list()
          page = page.items[0]
          print(page.product_id)
      - lang: Go
        source: |
          package main

          import (
            "context"
            "fmt"

            "github.com/dodopayments/dodopayments-go"
            "github.com/dodopayments/dodopayments-go/option"
          )

          func main() {
            client := dodopayments.NewClient(
              option.WithBearerToken("My Bearer Token"),
            )
            page, err := client.Subscriptions.List(context.TODO(), dodopayments.SubscriptionListParams{

            })
            if err != nil {
              panic(err.Error())
            }
            fmt.Printf("%+v\n", page)
          }
      - lang: Java
        source: >-
          package com.dodopayments.api.example;


          import com.dodopayments.api.client.DodoPaymentsClient;

          import com.dodopayments.api.client.okhttp.DodoPaymentsOkHttpClient;

          import com.dodopayments.api.models.subscriptions.SubscriptionListPage;

          import
          com.dodopayments.api.models.subscriptions.SubscriptionListParams;


          public final class Main {
              private Main() {}

              public static void main(String[] args) {
                  DodoPaymentsClient client = DodoPaymentsOkHttpClient.fromEnv();

                  SubscriptionListPage page = client.subscriptions().list();
              }
          }
      - lang: Kotlin
        source: >-
          package com.dodopayments.api.example


          import com.dodopayments.api.client.DodoPaymentsClient

          import com.dodopayments.api.client.okhttp.DodoPaymentsOkHttpClient

          import com.dodopayments.api.models.subscriptions.SubscriptionListPage

          import
          com.dodopayments.api.models.subscriptions.SubscriptionListParams


          fun main() {
              val client: DodoPaymentsClient = DodoPaymentsOkHttpClient.fromEnv()

              val page: SubscriptionListPage = client.subscriptions().list()
          }
      - lang: Ruby
        source: |-
          require "dodopayments"

          dodo_payments = Dodopayments::Client.new(
            bearer_token: "My Bearer Token",
            environment: "test_mode" # defaults to "live_mode"
          )

          page = dodo_payments.subscriptions.list

          puts(page)
  response:
    '200':
      application/json:
        schemaArray:
          - type: object
            properties:
              items:
                allOf:
                  - type: array
                    items:
                      $ref: '#/components/schemas/SubscriptionListResponseItem'
            refIdentifier: '#/components/schemas/GetSubscriptionsListResponse'
            requiredProperties:
              - items
        examples:
          example:
            value:
              items:
                - billing:
                    city: <string>
                    country: AF
                    state: <string>
                    street: <string>
                    zipcode: <string>
                  cancel_at_next_billing_date: true
                  cancelled_at: '2023-11-07T05:31:56Z'
                  created_at: '2023-11-07T05:31:56Z'
                  currency: AED
                  customer:
                    customer_id: <string>
                    email: <string>
                    name: <string>
                  discount_cycles_remaining: 123
                  discount_id: <string>
                  metadata: {}
                  next_billing_date: '2023-11-07T05:31:56Z'
                  on_demand: true
                  payment_frequency_count: 123
                  payment_frequency_interval: Day
                  previous_billing_date: '2023-11-07T05:31:56Z'
                  product_id: <string>
                  quantity: 123
                  recurring_pre_tax_amount: 123
                  status: pending
                  subscription_id: <string>
                  subscription_period_count: 123
                  subscription_period_interval: Day
                  tax_inclusive: true
                  trial_period_days: 123
        description: ''
    '500':
      _mintlify/placeholder:
        schemaArray:
          - type: any
            description: Something went wrong :(
        examples: {}
        description: Something went wrong :(
  deprecated: false
  type: path
components:
  schemas:
    BillingAddress:
      type: object
      required:
        - country
        - state
        - city
        - street
        - zipcode
      properties:
        city:
          type: string
          description: City name
        country:
          $ref: '#/components/schemas/CountryCodeAlpha2'
          description: Two-letter ISO country code (ISO 3166-1 alpha-2)
        state:
          type: string
          description: State or province name
        street:
          type: string
          description: >-
            Street address including house number and unit/apartment if
            applicable
        zipcode:
          type: string
          description: Postal code or ZIP code
    CountryCodeAlpha2:
      type: string
      description: ISO country code alpha2 variant
      enum:
        - AF
        - AX
        - AL
        - DZ
        - AS
        - AD
        - AO
        - AI
        - AQ
        - AG
        - AR
        - AM
        - AW
        - AU
        - AT
        - AZ
        - BS
        - BH
        - BD
        - BB
        - BY
        - BE
        - BZ
        - BJ
        - BM
        - BT
        - BO
        - BQ
        - BA
        - BW
        - BV
        - BR
        - IO
        - BN
        - BG
        - BF
        - BI
        - KH
        - CM
        - CA
        - CV
        - KY
        - CF
        - TD
        - CL
        - CN
        - CX
        - CC
        - CO
        - KM
        - CG
        - CD
        - CK
        - CR
        - CI
        - HR
        - CU
        - CW
        - CY
        - CZ
        - DK
        - DJ
        - DM
        - DO
        - EC
        - EG
        - SV
        - GQ
        - ER
        - EE
        - ET
        - FK
        - FO
        - FJ
        - FI
        - FR
        - GF
        - PF
        - TF
        - GA
        - GM
        - GE
        - DE
        - GH
        - GI
        - GR
        - GL
        - GD
        - GP
        - GU
        - GT
        - GG
        - GN
        - GW
        - GY
        - HT
        - HM
        - VA
        - HN
        - HK
        - HU
        - IS
        - IN
        - ID
        - IR
        - IQ
        - IE
        - IM
        - IL
        - IT
        - JM
        - JP
        - JE
        - JO
        - KZ
        - KE
        - KI
        - KP
        - KR
        - KW
        - KG
        - LA
        - LV
        - LB
        - LS
        - LR
        - LY
        - LI
        - LT
        - LU
        - MO
        - MK
        - MG
        - MW
        - MY
        - MV
        - ML
        - MT
        - MH
        - MQ
        - MR
        - MU
        - YT
        - MX
        - FM
        - MD
        - MC
        - MN
        - ME
        - MS
        - MA
        - MZ
        - MM
        - NA
        - NR
        - NP
        - NL
        - NC
        - NZ
        - NI
        - NE
        - NG
        - NU
        - NF
        - MP
        - 'NO'
        - OM
        - PK
        - PW
        - PS
        - PA
        - PG
        - PY
        - PE
        - PH
        - PN
        - PL
        - PT
        - PR
        - QA
        - RE
        - RO
        - RU
        - RW
        - BL
        - SH
        - KN
        - LC
        - MF
        - PM
        - VC
        - WS
        - SM
        - ST
        - SA
        - SN
        - RS
        - SC
        - SL
        - SG
        - SX
        - SK
        - SI
        - SB
        - SO
        - ZA
        - GS
        - SS
        - ES
        - LK
        - SD
        - SR
        - SJ
        - SZ
        - SE
        - CH
        - SY
        - TW
        - TJ
        - TZ
        - TH
        - TL
        - TG
        - TK
        - TO
        - TT
        - TN
        - TR
        - TM
        - TC
        - TV
        - UG
        - UA
        - AE
        - GB
        - UM
        - US
        - UY
        - UZ
        - VU
        - VE
        - VN
        - VG
        - VI
        - WF
        - EH
        - YE
        - ZM
        - ZW
    Currency:
      type: string
      enum:
        - AED
        - ALL
        - AMD
        - ANG
        - AOA
        - ARS
        - AUD
        - AWG
        - AZN
        - BAM
        - BBD
        - BDT
        - BGN
        - BHD
        - BIF
        - BMD
        - BND
        - BOB
        - BRL
        - BSD
        - BWP
        - BYN
        - BZD
        - CAD
        - CHF
        - CLP
        - CNY
        - COP
        - CRC
        - CUP
        - CVE
        - CZK
        - DJF
        - DKK
        - DOP
        - DZD
        - EGP
        - ETB
        - EUR
        - FJD
        - FKP
        - GBP
        - GEL
        - GHS
        - GIP
        - GMD
        - GNF
        - GTQ
        - GYD
        - HKD
        - HNL
        - HRK
        - HTG
        - HUF
        - IDR
        - ILS
        - INR
        - IQD
        - JMD
        - JOD
        - JPY
        - KES
        - KGS
        - KHR
        - KMF
        - KRW
        - KWD
        - KYD
        - KZT
        - LAK
        - LBP
        - LKR
        - LRD
        - LSL
        - LYD
        - MAD
        - MDL
        - MGA
        - MKD
        - MMK
        - MNT
        - MOP
        - MRU
        - MUR
        - MVR
        - MWK
        - MXN
        - MYR
        - MZN
        - NAD
        - NGN
        - NIO
        - NOK
        - NPR
        - NZD
        - OMR
        - PAB
        - PEN
        - PGK
        - PHP
        - PKR
        - PLN
        - PYG
        - QAR
        - RON
        - RSD
        - RUB
        - RWF
        - SAR
        - SBD
        - SCR
        - SEK
        - SGD
        - SHP
        - SLE
        - SLL
        - SOS
        - SRD
        - SSP
        - STN
        - SVC
        - SZL
        - THB
        - TND
        - TOP
        - TRY
        - TTD
        - TWD
        - TZS
        - UAH
        - UGX
        - USD
        - UYU
        - UZS
        - VES
        - VND
        - VUV
        - WST
        - XAF
        - XCD
        - XOF
        - XPF
        - YER
        - ZAR
        - ZMW
    CustomerLimitedDetailsResponse:
      type: object
      required:
        - customer_id
        - name
        - email
      properties:
        customer_id:
          type: string
          description: Unique identifier for the customer
        email:
          type: string
          description: Email address of the customer
        name:
          type: string
          description: Full name of the customer
    Metadata:
      type: object
      additionalProperties:
        type: string
      propertyNames:
        type: string
    SubscriptionListResponseItem:
      type: object
      description: Response struct representing subscription details
      required:
        - subscription_id
        - recurring_pre_tax_amount
        - tax_inclusive
        - currency
        - status
        - created_at
        - product_id
        - quantity
        - trial_period_days
        - subscription_period_interval
        - payment_frequency_interval
        - subscription_period_count
        - payment_frequency_count
        - next_billing_date
        - previous_billing_date
        - customer
        - metadata
        - cancel_at_next_billing_date
        - billing
        - on_demand
      properties:
        billing:
          $ref: '#/components/schemas/BillingAddress'
          description: Billing address details for payments
        cancel_at_next_billing_date:
          type: boolean
          description: Indicates if the subscription will cancel at the next billing date
        cancelled_at:
          type:
            - string
            - 'null'
          format: date-time
          description: Cancelled timestamp if the subscription is cancelled
        created_at:
          type: string
          format: date-time
          description: Timestamp when the subscription was created
        currency:
          $ref: '#/components/schemas/Currency'
          description: Currency used for the subscription payments
        customer:
          $ref: '#/components/schemas/CustomerLimitedDetailsResponse'
          description: Customer details associated with the subscription
        discount_cycles_remaining:
          type:
            - integer
            - 'null'
          format: int32
          description: Number of remaining discount cycles if discount is applied
        discount_id:
          type:
            - string
            - 'null'
          description: The discount id if discount is applied
        metadata:
          $ref: '#/components/schemas/Metadata'
          description: Additional custom data associated with the subscription
        next_billing_date:
          type: string
          format: date-time
          description: >-
            Timestamp of the next scheduled billing. Indicates the end of
            current billing period
        on_demand:
          type: boolean
          description: Wether the subscription is on-demand or not
        payment_frequency_count:
          type: integer
          format: int32
          description: Number of payment frequency intervals
        payment_frequency_interval:
          $ref: '#/components/schemas/TimeInterval'
          description: Time interval for payment frequency (e.g. month, year)
        previous_billing_date:
          type: string
          format: date-time
          description: >-
            Timestamp of the last payment. Indicates the start of current
            billing period
        product_id:
          type: string
          description: Identifier of the product associated with this subscription
        quantity:
          type: integer
          format: int32
          description: Number of units/items included in the subscription
        recurring_pre_tax_amount:
          type: integer
          format: int32
          description: >-
            Amount charged before tax for each recurring payment in smallest
            currency unit (e.g. cents)
        status:
          $ref: '#/components/schemas/SubscriptionStatus'
          description: Current status of the subscription
        subscription_id:
          type: string
          description: Unique identifier for the subscription
        subscription_period_count:
          type: integer
          format: int32
          description: Number of subscription period intervals
        subscription_period_interval:
          $ref: '#/components/schemas/TimeInterval'
          description: Time interval for the subscription period (e.g. month, year)
        tax_inclusive:
          type: boolean
          description: Indicates if the recurring_pre_tax_amount is tax inclusive
        trial_period_days:
          type: integer
          format: int32
          description: Number of days in the trial period (0 if no trial)
    SubscriptionStatus:
      type: string
      enum:
        - pending
        - active
        - on_hold
        - cancelled
        - failed
        - expired
    TimeInterval:
      type: string
      enum:
        - Day
        - Week
        - Month
        - Year

````


create subs 
import DodoPayments from 'dodopayments';

const client = new DodoPayments({
  bearerToken: 'My Bearer Token',
});

const subscription = await client.subscriptions.create({
  billing: { city: 'city', country: 'AF', state: 'state', street: 'street', zipcode: 'zipcode' },
  customer: { customer_id: 'customer_id' },
  product_id: 'product_id',
  quantity: 0,
});

console.log(subscription.payment_id);

{
  "addons": [
    {
      "addon_id": "<string>",
      "quantity": 123
    }
  ],
  "client_secret": "<string>",
  "customer": {
    "customer_id": "<string>",
    "email": "<string>",
    "name": "<string>"
  },
  "discount_id": "<string>",
  "expires_on": "2023-11-07T05:31:56Z",
  "metadata": {},
  "payment_id": "<string>",
  "payment_link": "<string>",
  "recurring_pre_tax_amount": 1,
  "subscription_id": "<string>"
}





import DodoPayments from 'dodopayments';

const client = new DodoPayments({
  bearerToken: 'My Bearer Token',
});

const subscription = await client.subscriptions.retrieve('subscription_id');

console.log(subscription.product_id);

{
  "addons": [
    {
      "addon_id": "<string>",
      "quantity": 123
    }
  ],
  "billing": {
    "city": "<string>",
    "country": "AF",
    "state": "<string>",
    "street": "<string>",
    "zipcode": "<string>"
  },
  "cancel_at_next_billing_date": true,
  "cancelled_at": "2023-11-07T05:31:56Z",
  "created_at": "2023-11-07T05:31:56Z",
  "currency": "AED",
  "customer": {
    "customer_id": "<string>",
    "email": "<string>",
    "name": "<string>"
  },
  "discount_cycles_remaining": 123,
  "discount_id": "<string>",
  "expires_at": "2023-11-07T05:31:56Z",
  "metadata": {},
  "meters": [
    {
      "currency": "AED",
      "description": "<string>",
      "free_threshold": 123,
      "measurement_unit": "<string>",
      "meter_id": "<string>",
      "name": "<string>",
      "price_per_unit": "10.50"
    }
  ],
  "next_billing_date": "2023-11-07T05:31:56Z",
  "on_demand": true,
  "payment_frequency_count": 123,
  "payment_frequency_interval": "Day",
  "previous_billing_date": "2023-11-07T05:31:56Z",
  "product_id": "<string>",
  "quantity": 123,
  "recurring_pre_tax_amount": 123,
  "status": "pending",
  "subscription_id": "<string>",
  "subscription_period_count": 123,
  "subscription_period_interval": "Day",
  "tax_inclusive": true,
  "trial_period_days": 123
}


import DodoPayments from 'dodopayments';

const client = new DodoPayments({
  bearerToken: 'My Bearer Token',
});

const response = await client.subscriptions.charge('subscription_id', { product_price: 0 });

console.log(response.payment_id);

{
  "payment_id": "<string>"
}

import DodoPayments from 'dodopayments';

const client = new DodoPayments({
  bearerToken: 'My Bearer Token',
});

// Automatically fetches more pages as needed.
for await (const subscriptionRetrieveUsageHistoryResponse of client.subscriptions.retrieveUsageHistory(
  'subscription_id',
)) {
  console.log(subscriptionRetrieveUsageHistoryResponse.end_date);
}


{
  "items": [
    {
      "end_date": "2023-11-07T05:31:56Z",
      "meters": [
        {
          "chargeable_units": "<string>",
          "consumed_units": "<string>",
          "currency": "AED",
          "free_threshold": 123,
          "id": "<string>",
          "name": "<string>",
          "price_per_unit": "<string>",
          "total_price": 123
        }
      ],
      "start_date": "2023-11-07T05:31:56Z"
    }
  ]
}