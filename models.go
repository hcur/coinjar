package main

import (
	"time"
)

/* Account */

type Account struct {
	ID      int     `json:"id" gorm:"primaryKey"`
	Name    string  `json:"name" gorm:"not null"`
	Balance float32 `json:"balance" gorm:"default:0"`
}

type Request_newAccount struct {
	Name    string  `json:"name" validate:"required"`
	Balance float32 `json:"balance"`
}

/* Transaction */

type Transaction struct {
	Source string    `json:"source"`
	Date   time.Time `json:"date"`
	Amount float32   `json:"amount"`
	Note   string    `json:"note"`
}
