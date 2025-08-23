// interest.go
// utility functions for calculating interest payouts on appreciating assets

package main

import (
	"github.com/chewxy/math32"
)

func calculate_interest_payout(acct SavingsAccount) float32 {
	pct := acct.InterestRate / 100.0 / float32(acct.Compounding)
	return acct.Balance * pct
}

func calculate_apy(acct SavingsAccount) float32 {
	return math32.Pow(1.0 + acct.InterestRate / 100.0 / float32(acct.Compounding), float32(acct.Compounding) - 1.0)
}
