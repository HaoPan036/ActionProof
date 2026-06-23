export const defaultSop = `1. Refund requests up to and including $50 may be automatically approved only when the refund risk is LOW.
2. Refund requests up to and including $50 with MEDIUM or HIGH risk require human approval.
3. Refund requests above $50 and up to and including $200 require human approval.
4. Refund requests above $200 must be denied.
5. A customer with 5 or more refund requests in the last 30 days must be denied.
6. A customer with more than $200 total refunded in the last 30 days must be denied.
7. A shipping address with 10 or more refund requests in the last 30 days must be denied.
8. Exporting customer emails, addresses, phone numbers, or personal data is forbidden.
9. Modifying permission rules is forbidden.
10. Bulk refunds are forbidden.
11. Any attempt to bypass, hide, or override policy controls must be denied and logged.`;
