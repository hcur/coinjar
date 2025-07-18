package main

import (
	"github.com/google/uuid"

	"time"
)

/* Account */

type Account struct {
	ID      uuid.UUID `json:"id" gorm:"primaryKey"`
	Name    string    `json:"name" gorm:"not null"`
	Balance float32   `json:"balance" gorm:"default:0"`
}

type Request_newAccount struct {
	Name    string  `json:"name" validate:"required"`
	Balance float32 `json:"balance"`
}

/* Transaction */

type Transaction struct {
	ID        uuid.UUID `json:"id" gorm:"primaryKey"`
	AccountID uuid.UUID `json:"account_id" gorm:"type:uuid;not null"`
	Source    string    `json:"source" gorm:"not null"`
	Date      time.Time `json:"date" gorm:"not null"`
	Amount    float32   `json:"amount" gorm:"not null"`
	Note      string    `json:"note"`
}

type Request_newTransaction struct {
	Account uuid.UUID `json:"account" validate:"required"`
	Source  string    `json:"source" validate:"required"`
	Date    time.Time `json:"date" validate:"required"`
	Amount  float32   `json:"amount" validate:"required"`
	Note    string    `json:"note"`
}
